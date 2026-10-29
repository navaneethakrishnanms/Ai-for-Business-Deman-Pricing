"""Seeded 120-day synthetic student simulation.

Writes data/synthetic/{sales_log,items,student_tiers}.csv and grader_data/hidden_truth.json.

Days 1-60  : manager-set prices that follow the unobserved daily crowd (confounded, like real managers).
Days 61-120: randomised weekly test weeks: item price x {0.85 .. 1.15}; a random subset of item-weeks
             also moves to the small or large portion tier.
Combo discounts are drawn at random (0, 5, 10, 15 %) every week.
The crowd shock is never written to the log.
"""
import json
from datetime import date, timedelta

import numpy as np
import pandas as pd

from ..config import SEED, SYNTH_DIR, GRADER_DIR, DAY_TYPES, PORTION_TIER_MULT
from .world import (get_world, day_type_of, cost_at, ITEM_SPECS, DAYS, RANDOMISED_FROM, TARGET_ELASTICITY)

START_DATE = date(2026, 6, 1)   # a Monday
CROWD_SIGMA = 0.12
PRICE_STEPS = np.array([0.85, 0.90, 0.95, 1.0, 1.05, 1.10, 1.15])
COMBO_DISC_STEPS = np.array([0.0, 5.0, 10.0, 15.0])
PORTION_CHANGE_SHARE = 0.35       # share of item-weeks that move off the regular portion tier
PORTION_TIERS = np.array([PORTION_TIER_MULT["small"], PORTION_TIER_MULT["large"]])


def _round_price(p):
    return np.maximum(np.round(p * 2) / 2, 1.0)


def _sample_day(w, rng, price, portion, disc, dt, shock):
    nm, na = len(w.main_idx), len(w.addon_idx)
    main_cnt = np.zeros(nm + 1, dtype=int)
    pair_cnt = np.zeros((nm + 1, na), dtype=int)
    for t in w.tiers:
        n_t = int(rng.poisson(w.footfall[dt] * w.mix[dt][t] * shock))
        p_main, a_given, none = w.tier_choice(price, portion, disc, dt, t)
        counts = rng.multinomial(n_t, p_main)
        probs = np.concatenate([a_given, none], axis=1)
        for m in range(nm + 1):
            if counts[m] > 0:
                pair_cnt[m] += rng.multinomial(counts[m], probs[m])[:na]
        main_cnt += counts
    return main_cnt, pair_cnt


def simulate(seed: int = SEED, write: bool = True, out_dir=SYNTH_DIR, grader_dir=GRADER_DIR):
    rng = np.random.default_rng(seed)
    w = get_world()
    n_items, n_combo = len(w.item_ids), len(w.combos)
    nm = len(w.main_idx)
    n_weeks = DAYS // 7 + 1
    crowd = rng.normal(0.0, CROWD_SIGMA, DAYS)           # unobserved: never written out
    wk_price = rng.choice(PRICE_STEPS, size=(n_weeks, n_items))
    changed = rng.random((n_weeks, n_items)) < PORTION_CHANGE_SHARE
    wk_port = np.where(changed, rng.choice(PORTION_TIERS, size=(n_weeks, n_items)), 1.0)
    wk_disc = rng.choice(COMBO_DISC_STEPS, size=(n_weeks, n_combo))

    item_rows, combo_rows = [], []
    for d in range(DAYS):
        dt, wk, test = day_type_of(d), d // 7, d >= RANDOMISED_FROM
        if test:
            price = _round_price(w.price_ref * wk_price[wk])
            portion = np.round(w.portion_ref * wk_port[wk] / 5) * 5
        else:
            z = np.clip(crowd[d] / CROWD_SIGMA, -2, 2)
            price = _round_price(w.price_ref * (1 + 0.04 * z + rng.normal(0, 0.01, n_items)))
            portion = w.portion_ref.copy()
        disc = wk_disc[wk].copy()
        main_cnt, pair_cnt = _sample_day(w, rng, price, portion, disc, dt, float(np.exp(crowd[d])))
        units = np.zeros(n_items)
        units[w.main_idx] = main_cnt[:nm]
        units[w.addon_idx] = pair_cnt.sum(axis=0)
        cost = cost_at(w.cost_ref, portion, w.portion_ref)
        day_date = (START_DATE + timedelta(days=d)).isoformat()
        item_disc = np.zeros(n_items)
        for k, c in enumerate(w.combos):
            item_disc[c["main"]] = disc[k]
            item_disc[c["addon"]] = disc[k]
        for i, key in enumerate(w.item_ids):
            item_rows.append(dict(
                date=day_date, day_index=d, item_id=key, item=ITEM_SPECS[i][1], price=float(price[i]),
                portion_size_g=int(portion[i]), cost=round(float(cost[i]), 2), qty_sold=int(units[i]),
                combo="no", combo_items="", day_type=dt, discount_pct=float(item_disc[i]), price_test=int(test)))
        for k, c in enumerate(w.combos):
            pairs = int(pair_cnt[w.c_mi[k], w.c_ai[k]])
            combo_rows.append(dict(
                date=day_date, day_index=d, item_id=c["combo_id"], item=c["name"],
                price=round(float((price[c["main"]] + price[c["addon"]]) * (1 - disc[k] / 100.0)), 2),
                portion_size_g=int(portion[c["main"]] + portion[c["addon"]]),
                cost=round(float(cost[c["main"]] + cost[c["addon"]]), 2), qty_sold=pairs, combo="yes",
                combo_items=f"{w.item_ids[c['main']]}+{w.item_ids[c['addon']]}", day_type=dt,
                discount_pct=float(disc[k]), price_test=int(test)))
    sales = pd.DataFrame(item_rows + combo_rows)
    items = _items_table(w)
    tiers = _tiers_table(w)
    truth = _hidden_truth(w)
    if write:
        out_dir.mkdir(parents=True, exist_ok=True)
        grader_dir.mkdir(parents=True, exist_ok=True)
        sales.to_csv(out_dir / "sales_log.csv", index=False)
        items.to_csv(out_dir / "items.csv", index=False)
        tiers.to_csv(out_dir / "student_tiers.csv", index=False)
        (grader_dir / "hidden_truth.json").write_text(json.dumps(truth, indent=2))
    return sales, items, tiers, truth


def _items_table(w):
    rows = []
    for s in ITEM_SPECS:
        rows.append(dict(item_id=s[0], name=s[1], kind=s[2], price=float(s[3]), cost=float(s[4]),
                         portion_size_g=int(s[5]), combo_items="", discount_pct=0.0))
    for c in w.combos:
        m, a = w.item_ids[c["main"]], w.item_ids[c["addon"]]
        rows.append(dict(item_id=c["combo_id"], name=c["name"], kind="combo",
                         price=float(w.price_ref[c["main"]] + w.price_ref[c["addon"]]),
                         cost=float(w.cost_ref[c["main"]] + w.cost_ref[c["addon"]]),
                         portion_size_g=int(w.portion_ref[c["main"]] + w.portion_ref[c["addon"]]),
                         combo_items=f"{m}+{a}", discount_pct=float(c["discount_pct"])))
    return pd.DataFrame(rows)


def _tiers_table(w):
    rows = []
    for t in w.tiers:
        row = dict(tier=t, budget_median=w.budget_median[t], budget_sigma=w.sigma, price_sensitivity=w.sens[t])
        for dt in DAY_TYPES:
            row[f"share_{dt}"] = w.mix[dt][t]
        rows.append(row)
    return pd.DataFrame(rows)


def _hidden_truth(w):
    return dict(
        seed=SEED,
        price_elasticity=w.true_price_elasticity(),
        portion_effect=w.true_portion_effect(),
        combos={c["combo_id"]: dict(attach_lift_logit_per_10pct=c["kappa"], main_traffic_lift_per_10pct=c["lam"])
                for c in w.combos},
        average_units_per_day=dict(zip(w.item_ids, [float(x) for x in w.avg_item_units()])),
    )


def calibration_table(sales: pd.DataFrame, truth: dict) -> pd.DataFrame:
    it = sales[sales["combo"] == "no"]
    rows = []
    for key, g in it.groupby("item_id", sort=False):
        rows.append(dict(item=key, mean_units_per_day=round(g["qty_sold"].mean(), 1),
                         true_elasticity=round(truth["price_elasticity"][key], 2),
                         in_range=bool(-3.2 - 0.01 <= truth["price_elasticity"][key] <= -1.6 + 0.01)))
    return pd.DataFrame(rows)


if __name__ == "__main__":
    s, i, t, tr = simulate()
    print(calibration_table(s, tr).to_string(index=False))
    print(f"item-day rows {int((s.combo == 'no').sum())}, combo rows {int((s.combo == 'yes').sum())}")
