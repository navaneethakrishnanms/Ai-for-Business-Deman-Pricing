"""Verify script: measure real numbers, print one-page scorecard, save to data/scorecard.json.

Run: python scripts/verify.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def main():
    import numpy as np
    from app.config import ARTIFACT_DIR, SYNTH_DIR, GRADER_DIR, SCORECARD_PATH, MODEL_VERSION
    from app.models.demand import DemandBundle
    from app.models.combo import ComboModel
    from app.models.student import StudentLayer
    from app.storage import Store
    from app.engine.engine import Engine
    from app.engine.optimizer import Optimizer

    # ── load ──────────────────────────────────────────────────────────────────
    import pandas as pd
    bundle = DemandBundle.load(ARTIFACT_DIR)
    sales = pd.read_csv(SYNTH_DIR / "sales_log.csv", parse_dates=["date"])
    items = pd.read_csv(SYNTH_DIR / "items.csv")
    non_combo = items[items.kind != "combo"]
    kind_map = dict(zip(non_combo.item_id, non_combo.kind))
    price_ref_map = dict(zip(non_combo.item_id, non_combo.price))
    cm = ComboModel()
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

    # ── load hidden truth ──────────────────────────────────────────────────────
    ht_path = GRADER_DIR / "hidden_truth.json"
    hidden = json.loads(ht_path.read_text()) if ht_path.exists() else {}
    true_e = hidden.get("price_elasticity", {})

    # ── metrics ───────────────────────────────────────────────────────────────
    meta = bundle.meta
    val = meta.get("validation", {})

    # elasticity coverage
    draws = bundle.draws["beta"]
    elas_rows = []
    n_covered = 0
    for i, iid in enumerate(bundle.item_ids):
        te = true_e.get(iid)
        if te is None:
            continue
        p10 = float(np.percentile(draws[:, i], 10))
        p90 = float(np.percentile(draws[:, i], 90))
        point = float(bundle.point["beta"][i])
        covered = p10 <= te <= p90
        n_covered += int(covered)
        elas_rows.append(dict(item_id=iid, true=round(te, 3), point=round(point, 3),
                              p10=round(p10, 3), p90=round(p90, 3), covered=covered))

    # gate precision
    recs = opt.recommend()["recommendations"]
    apply_recs = [r for r in recs if r["status"] == "apply"]
    truly_good = sum(1 for r in apply_recs if r["incremental_profit"]["mean"] > 0)
    gate_precision = round(truly_good / max(len(apply_recs), 1), 3)

    # planted cases
    health = eng.health()
    health_map = {r["item_id"]: r for r in health}
    planted = {
        "chicken_biryani_loss_maker": "loss_maker" in health_map.get("chicken_biryani", {}).get("flags", []),
        "paneer_roll_loss_maker": "loss_maker" in health_map.get("paneer_roll", {}).get("flags", []),
        "dosa_not_loss_maker": "loss_maker" not in health_map.get("dosa", {}).get("flags", []),
        "salad_bowl_units_le25": health_map.get("salad_bowl", {}).get("units_per_day", 99) <= 25,
        "fresh_juice_units_le25": health_map.get("fresh_juice", {}).get("units_per_day", 99) <= 25,
        "biryani_units_50_100": 50 <= health_map.get("chicken_biryani", {}).get("units_per_day", 0) <= 100,
    }

    # +10% price monotone check
    today = eng.today()
    monotone_violations = 0
    from app.config import DAY_TYPES
    mix = {d: 0.25 for d in DAY_TYPES}
    for i, iid in enumerate(eng.ids):
        if eng.kinds[i] == "combo":
            continue
        m_base = today.copy()
        m_up = today.copy()
        m_up.price[i] *= 1.10
        mu_base = float(eng.evaluate(m_base, mix)["units"][:, i].mean())
        mu_up = float(eng.evaluate(m_up, mix)["units"][:, i].mean())
        if mu_up > mu_base + 1e-3:
            monotone_violations += 1

    # break-even check
    from app.models.combo import break_even_take_rate
    be = break_even_take_rate(70, 45, 20, 5, 82, 0.30, 1.0)

    scorecard = {
        "model_version": MODEL_VERSION,
        "data_source": "synthetic",
        "holdout_direction_hit_rate": round(val.get("holdout_direction_hit_rate", 0), 4),
        "holdout_direction_hit_rate_naive": round(val.get("holdout_direction_hit_rate_naive", 0), 4),
        "holdout_unit_wape": round(val.get("holdout_unit_wape", 0), 4),
        "tau_beta": meta.get("tau_beta"),
        "n_boot": meta.get("n_boot"),
        "fit_seconds": meta.get("fit_seconds"),
        "elasticity_coverage": f"{n_covered}/{len(elas_rows)}",
        "elasticity_rows": elas_rows,
        "apply_gate_precision": gate_precision,
        "n_apply_recs": len(apply_recs),
        "price_monotone_violations": monotone_violations,
        "break_even_check": round(be, 4),
        "planted_cases": planted,
    }

    SCORECARD_PATH.parent.mkdir(parents=True, exist_ok=True)
    SCORECARD_PATH.write_text(json.dumps(scorecard, indent=2))

    # ── print ─────────────────────────────────────────────────────────────────
    SEP = "=" * 65
    print(SEP)
    print("  CampusPrice AI – Scorecard")
    print(SEP)
    print(f"  Model version      : {MODEL_VERSION}")
    print(f"  Direction hit rate : {scorecard['holdout_direction_hit_rate']:.4f}  (naive: {scorecard['holdout_direction_hit_rate_naive']:.4f})")
    print(f"  Unit WAPE          : {scorecard['holdout_unit_wape']:.4f}")
    print(f"  Tau beta           : {scorecard['tau_beta']}")
    print(f"  Bootstrap draws    : {scorecard['n_boot']}")
    print(f"  Fit time           : {scorecard['fit_seconds']} s")
    print(f"  Elasticity cover   : {scorecard['elasticity_coverage']}")
    print(f"  Apply precision    : {scorecard['apply_gate_precision']:.0%}  ({scorecard['n_apply_recs']} Apply recs)")
    print(f"  Price monotone OK  : {scorecard['price_monotone_violations']} violations (0 expected)")
    print(f"  Break-even check   : {scorecard['break_even_check']:.4f} (expected 0.6429)")
    print("\n  Planted cases:")
    for k, v in planted.items():
        mark = "PASS" if v else "FAIL"
        print(f"    [{mark}] {k}")
    print(SEP)
    print(f"  Scorecard saved → {SCORECARD_PATH}")
    print(SEP)


if __name__ == "__main__":
    main()
