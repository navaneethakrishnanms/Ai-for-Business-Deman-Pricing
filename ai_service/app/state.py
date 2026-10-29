"""Global application state: single Engine instance loaded once at startup."""
from __future__ import annotations

import json
import logging
from pathlib import Path

import numpy as np
import pandas as pd

from .config import (
    ARTIFACT_DIR, SYNTH_DIR, KAGGLE_FINDINGS_PATH, MODEL_VERSION, DATA_SOURCE,
    SCORECARD_PATH, settings,
)
from .models.demand import DemandBundle, fit_bundle
from .models.combo import ComboModel
from .models.student import StudentLayer
from .storage import Store
from .engine.engine import Engine
from .engine.optimizer import Optimizer

log = logging.getLogger("campusprice")

_engine: Engine | None = None
_optimizer: Optimizer | None = None
_store: Store | None = None


def _prior_from_kaggle():
    if KAGGLE_FINDINGS_PATH.exists():
        d = json.loads(KAGGLE_FINDINGS_PATH.read_text())
        p = d.get("demand_model_prior", {})
        mean = float(p.get("mean", -2.4))
        sd = float(p.get("sd", 0.4))
        return (mean, sd)
    return (-2.4, 0.4)


def _load_sales():
    p = SYNTH_DIR / "sales_log.csv"
    if not p.exists():
        raise FileNotFoundError(f"Missing {p} – run python scripts/bootstrap.py first")
    return pd.read_csv(p, parse_dates=["date"])


def _load_items():
    return pd.read_csv(SYNTH_DIR / "items.csv")


def _fit_and_cache() -> Engine:
    log.info("fitting demand model …")
    sales = _load_sales()
    items = _load_items()
    non_combo = items[items.kind != "combo"]
    item_ids = list(non_combo.item_id)
    kinds = list(non_combo.kind)
    price_ref = list(non_combo.price)
    portion_ref = list(non_combo.portion_size_g)
    cost_ref = list(non_combo.cost)

    cm = ComboModel()
    kind_map = dict(zip(non_combo.item_id, non_combo.kind))
    price_ref_map = dict(zip(non_combo.item_id, non_combo.price))
    cm.prepare(sales, price_ref_map, kind_map)
    cm.fit_point()

    hook_reps = []

    def combo_hook(day_counts):
        hook_reps.append(cm.draw_once(day_counts))

    prior_b = _prior_from_kaggle()
    bundle = fit_bundle(
        sales, item_ids, kinds, price_ref, portion_ref, cost_ref,
        prior_b=prior_b, log=log.info, combo_hook=combo_hook,
    )

    cm.finalize(hook_reps)
    bundle.save(ARTIFACT_DIR)

    store = Store()
    student = StudentLayer()
    eng = Engine(bundle, cm, student, items, sales, store)
    return eng


def _load_cached() -> Engine:
    log.info("loading cached demand model …")
    bundle = DemandBundle.load(ARTIFACT_DIR)
    sales = _load_sales()
    items = _load_items()

    # reload combo model
    cm = ComboModel()
    kind_map = dict(zip(items[items.kind != "combo"].item_id, items[items.kind != "combo"].kind))
    price_ref_map = dict(zip(items[items.kind != "combo"].item_id, items[items.kind != "combo"].price))
    cm.prepare(sales, price_ref_map, kind_map)
    cm.fit_point()

    # rebuild draws via combo_hook replay
    hook_reps = []
    rng = np.random.default_rng(bundle.meta.get("seed", 2026))
    n_days = bundle.meta.get("trained_through_day", 119) + 1
    n_boot = bundle.meta.get("n_boot", 200)
    BLOCK_DAYS = bundle.meta.get("bootstrap_block_days", 7)
    n_blocks = (n_days + BLOCK_DAYS - 1) // BLOCK_DAYS
    for _ in range(n_boot):
        blocks = np.bincount(rng.choice(n_blocks, size=n_blocks, replace=True), minlength=n_blocks).astype(float)
        counts = blocks[np.arange(n_days) // BLOCK_DAYS]
        hook_reps.append(cm.draw_once(counts))
    cm.finalize(hook_reps)

    store = Store()
    student = StudentLayer()
    return Engine(bundle, cm, student, items, sales, store)


def startup():
    """Called once at FastAPI startup. Fits or loads the model."""
    global _engine, _optimizer, _store
    _store = Store()
    demand_npz = ARTIFACT_DIR / "demand_model.npz"
    demand_json = ARTIFACT_DIR / "demand_model.json"
    if demand_npz.exists() and demand_json.exists():
        try:
            _engine = _load_cached()
            log.info("model loaded from artifacts")
        except Exception as e:
            log.warning(f"cache load failed ({e}), refitting …")
            _engine = _fit_and_cache()
    else:
        _engine = _fit_and_cache()
    _optimizer = Optimizer(_engine)
    # seed approved offers from Apply results
    _seed_offers()
    log.info("startup complete")


def _seed_offers():
    """Populate student offers table from Apply-status recommendations if empty."""
    offers = _store.offers()
    if offers:
        return
    try:
        result = _optimizer.recommend(include_frontier=False)
        for rec in result["recommendations"]:
            if rec["status"] == "apply" and rec["kind"] == "combo":
                _store.set_offer(rec["combo_id"], rec["proposed_discount_pct"], "auto_seed")
    except Exception as e:
        log.warning(f"offer seeding skipped: {e}")


def get_engine() -> Engine:
    if _engine is None:
        raise RuntimeError("Engine not initialized – call startup() first")
    return _engine


def get_optimizer() -> Optimizer:
    if _optimizer is None:
        raise RuntimeError("Optimizer not initialized – call startup() first")
    return _optimizer


def get_store() -> Store:
    if _store is None:
        raise RuntimeError("Store not initialized – call startup() first")
    return _store
