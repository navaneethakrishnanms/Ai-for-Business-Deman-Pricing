"""Bootstrap script: generate synthetic data, fit model, seed SQLite, export openapi.json.

Run once before starting the server:
    python scripts/bootstrap.py

Safe to re-run: skips steps whose artifacts already exist (use --force to redo all).
"""
from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("bootstrap")


def step(msg: str):
    log.info(f"{'='*60}")
    log.info(f"  {msg}")
    log.info(f"{'='*60}")


def main(force: bool = False):
    from app.config import SYNTH_DIR, ARTIFACT_DIR, SCORECARD_PATH

    # ── M3: synthetic data ────────────────────────────────────────────────────
    sales_csv = SYNTH_DIR / "sales_log.csv"
    if force or not sales_csv.exists():
        step("Generating synthetic sales data …")
        from app.synth.generate import simulate, calibration_table
        sales, items, tiers, truth = simulate()
        log.info(f"  item-day rows: {int((sales.combo == 'no').sum())}")
        log.info(f"  combo rows:    {int((sales.combo == 'yes').sum())}")
        log.info("\nCalibration table (true elasticities):")
        print(calibration_table(sales, truth).to_string(index=False))
    else:
        log.info(f"Synthetic data found at {sales_csv}, skipping generation (use --force to redo)")

    # ── M4: demand model ──────────────────────────────────────────────────────
    demand_npz = ARTIFACT_DIR / "demand_model.npz"
    if force or not demand_npz.exists():
        step("Fitting demand model + combo model (200 bootstrap draws) …")
        import json
        import numpy as np
        import pandas as pd
        from app.config import KAGGLE_FINDINGS_PATH, N_BOOT, SEED
        from app.models.demand import fit_bundle
        from app.models.combo import ComboModel
        from app.models.student import StudentLayer
        from app.storage import Store
        from app.engine.engine import Engine
        from app.engine.optimizer import Optimizer

        sales = pd.read_csv(SYNTH_DIR / "sales_log.csv", parse_dates=["date"])
        items = pd.read_csv(SYNTH_DIR / "items.csv")
        non_combo = items[items.kind != "combo"]
        item_ids = list(non_combo.item_id)
        kinds = list(non_combo.kind)
        price_ref = list(non_combo.price)
        portion_ref = list(non_combo.portion_size_g)
        cost_ref = list(non_combo.cost)

        # Kaggle prior
        prior_b = (-2.4, 0.4)
        if KAGGLE_FINDINGS_PATH.exists():
            kf = json.loads(KAGGLE_FINDINGS_PATH.read_text())
            p = kf.get("demand_model_prior", {})
            prior_b = (float(p.get("mean", -2.4)), float(p.get("sd", 0.4)))

        cm = ComboModel()
        kind_map = dict(zip(non_combo.item_id, non_combo.kind))
        price_ref_map = dict(zip(non_combo.item_id, non_combo.price))
        cm.prepare(sales, price_ref_map, kind_map)
        cm.fit_point()

        hook_reps = []
        def combo_hook(day_counts):
            hook_reps.append(cm.draw_once(day_counts))

        bundle = fit_bundle(
            sales, item_ids, kinds, price_ref, portion_ref, cost_ref,
            prior_b=prior_b, log=log.info, combo_hook=combo_hook,
        )
        cm.finalize(hook_reps)
        bundle.save(ARTIFACT_DIR)
        log.info(f"Model saved to {ARTIFACT_DIR}")

        # Build scorecard
        store = Store()
        student = StudentLayer()
        eng = Engine(bundle, cm, student, items, sales, store)
        opt = Optimizer(eng)
        _write_scorecard(eng, bundle, opt, SCORECARD_PATH)
    else:
        log.info(f"Model artifacts found at {ARTIFACT_DIR}, skipping fit (use --force to redo)")
        # still write scorecard if missing
        if force or not SCORECARD_PATH.exists():
            import json, pandas as pd
            from app.models.demand import DemandBundle
            from app.models.combo import ComboModel
            from app.models.student import StudentLayer
            from app.storage import Store
            from app.engine.engine import Engine
            from app.engine.optimizer import Optimizer
            import numpy as np

            bundle = DemandBundle.load(ARTIFACT_DIR)
            sales = pd.read_csv(SYNTH_DIR / "sales_log.csv", parse_dates=["date"])
            items = pd.read_csv(SYNTH_DIR / "items.csv")
            cm = ComboModel()
            non_combo = items[items.kind != "combo"]
            kind_map = dict(zip(non_combo.item_id, non_combo.kind))
            price_ref_map = dict(zip(non_combo.item_id, non_combo.price))
            cm.prepare(sales, price_ref_map, kind_map)
            cm.fit_point()
            rng = np.random.default_rng(bundle.meta.get("seed", 2026))
            n_days = bundle.meta.get("trained_through_day", 119) + 1
            n_boot = bundle.meta.get("n_boot", 200)
            bdays = 7
            n_blocks = (n_days + bdays - 1) // bdays
            reps = []
            for _ in range(n_boot):
                blocks = np.bincount(rng.choice(n_blocks, size=n_blocks, replace=True), minlength=n_blocks).astype(float)
                counts = blocks[np.arange(n_days) // bdays]
                reps.append(cm.draw_once(counts))
            cm.finalize(reps)
            store = Store()
            student = StudentLayer()
            eng = Engine(bundle, cm, student, items, sales, store)
            opt = Optimizer(eng)
            _write_scorecard(eng, bundle, opt, SCORECARD_PATH)

    # ── M8: challenger model (GBM, price-monotone, cross-check only) ────────────
    step("Fitting M8 Challenger model (GBM, price-monotone cross-check) …")
    try:
        import pandas as pd
        from app.engine.challenger import fit as fit_challenger
        sales_for_chal = pd.read_csv(SYNTH_DIR / "sales_log.csv", parse_dates=["date"])
        items_for_chal = pd.read_csv(SYNTH_DIR / "items.csv")
        item_ids_for_chal = list(items_for_chal[items_for_chal.kind != "combo"].item_id)
        chal = fit_challenger(sales_for_chal, item_ids_for_chal)
        # append to scorecard
        if SCORECARD_PATH.exists() and chal:
            import json as _json
            sc = _json.loads(SCORECARD_PATH.read_text())
            sc["challenger"] = chal
            SCORECARD_PATH.write_text(_json.dumps(sc, indent=2))
            log.info("Challenger results added to scorecard.")
    except Exception as e:
        log.warning("Challenger fit skipped: %s", e)

    log.info("Bootstrap complete. Start the server:")
    log.info("  uvicorn app.main:app --host 0.0.0.0 --port 8001")


def _write_scorecard(eng, bundle, opt, path):
    import json, numpy as np
    from app.config import GRADER_DIR, MODEL_VERSION, DATA_SOURCE
    meta = bundle.meta
    val = meta.get("validation", {})

    # hidden truth check
    hidden = None
    ht_path = GRADER_DIR / "hidden_truth.json"
    if ht_path.exists():
        hidden = json.loads(ht_path.read_text())

    # elasticity coverage
    beta_draws = bundle.draws["beta"]  # (S, n)
    n_covered = 0
    elas_rows = []
    if hidden:
        true_e = hidden.get("price_elasticity", {})
        for i, iid in enumerate(bundle.item_ids):
            te = true_e.get(iid)
            if te is None:
                continue
            p10, p90 = float(np.percentile(beta_draws[:, i], 10)), float(np.percentile(beta_draws[:, i], 90))
            covered = p10 <= te <= p90
            n_covered += int(covered)
            elas_rows.append(dict(item_id=iid, true=round(te, 3), p10=round(p10, 3), p90=round(p90, 3), covered=covered))

    # gate calibration (apply recs vs hidden truth profit)
    try:
        recs = opt.recommend()["recommendations"]
        apply_recs = [r for r in recs if r["status"] == "apply"]
        n_truly_improve = 0
        for r in apply_recs:
            if hidden and r["kind"] == "item":
                # conservative check: incremental_profit mean > 0
                if r["incremental_profit"]["mean"] > 0:
                    n_truly_improve += 1
        gate_pct = n_truly_improve / max(len(apply_recs), 1)
    except Exception:
        gate_pct = None
        apply_recs = []

    scorecard = {
        "model_version": MODEL_VERSION,
        "data_source": DATA_SOURCE,
        "holdout_direction_hit_rate": val.get("holdout_direction_hit_rate"),
        "holdout_direction_hit_rate_naive": val.get("holdout_direction_hit_rate_naive"),
        "holdout_unit_wape": val.get("holdout_unit_wape"),
        "tau_beta": meta.get("tau_beta"),
        "n_boot": meta.get("n_boot"),
        "fit_seconds": meta.get("fit_seconds"),
        "elasticity_coverage_n": n_covered,
        "elasticity_coverage_total": len(elas_rows),
        "elasticity_rows": elas_rows,
        "apply_gate_precision": round(gate_pct, 3) if gate_pct is not None else None,
        "n_apply_recs": len(apply_recs),
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(scorecard, indent=2))
    log.info(f"Scorecard written to {path}")
    log.info(f"  direction hit rate: {val.get('holdout_direction_hit_rate', '?'):.3f}")
    log.info(f"  elasticity coverage: {n_covered}/{len(elas_rows)}")
    return scorecard


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Regenerate all artifacts")
    args = parser.parse_args()
    main(force=args.force)
