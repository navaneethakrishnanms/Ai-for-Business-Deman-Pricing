"""Layer 2: combo take-rate model.

For a (main, add-on) pair, the share of main buyers who also buy the add-on (the attach rate, which is the
combo take rate whenever a discount applies) follows a logistic curve in the combo discount, the add-on
price and the day type. It is fitted on the random weekly discounts, once on the data and once per
bootstrap replicate (same resampled weeks as the demand model, so draws are paired).

Pairs with no combo data fall back to a pooled estimate, flagged data_confidence = "pooled"; the gate never
lets a pooled pair go beyond Pilot.
"""
import numpy as np
import pandas as pd

from ..config import DAY_TYPES
from .glm import fit_binomial

NF = 3 + len(DAY_TYPES) - 1       # [1, disc/10, ln add-on price ratio, dt dummies]
PEN = np.array([1e-3, 0.5, 0.5] + [0.5] * (len(DAY_TYPES) - 1))


def _design(disc10, ln_pa, dt):
    X = np.zeros((len(disc10), NF))
    X[:, 0] = 1.0
    X[:, 1] = disc10
    X[:, 2] = ln_pa
    for j in range(1, len(DAY_TYPES)):
        X[:, 2 + j] = (dt == j)
    return X


class ComboModel:
    def __init__(self):
        self.pairs = {}        # (main_id, addon_id) -> dict(X, trials, succ, day)
        self.point = {}        # pair -> beta (NF,)
        self.draws = {}        # pair -> (S, NF)
        self.pooled = None     # (beta point, draws) used for unseen pairs
        self.addon_attach_prior = {}

    def prepare(self, sales: pd.DataFrame, price_ref: dict, kinds: dict):
        items = sales[sales["combo"] == "no"].set_index(["day_index", "item_id"])
        dt_idx = {d: i for i, d in enumerate(DAY_TYPES)}
        for key, g in sales[sales["combo"] == "yes"].groupby("combo_items"):
            main, addon = key.split("+")
            g = g.sort_values("day_index")
            days = g["day_index"].to_numpy()
            trials = np.array([items.loc[(d, main), "qty_sold"] for d in days], float)
            pa = np.array([items.loc[(d, addon), "price"] for d in days], float)
            self.pairs[(main, addon)] = dict(
                X=_design(g["discount_pct"].to_numpy() / 10.0, np.log(pa / price_ref[addon]),
                          g["day_type"].map(dt_idx).to_numpy()),
                trials=trials, succ=g["qty_sold"].to_numpy(float), day=days)
        # overall attach level per add-on (add-on units / all main units), used only to centre unseen pairs
        flat = sales[sales["combo"] == "no"]
        mains_total = flat[flat["item_id"].map(kinds) == "main"]["qty_sold"].sum()
        for a, g in flat[flat["item_id"].map(kinds) == "addon"].groupby("item_id"):
            self.addon_attach_prior[a] = float(g["qty_sold"].sum() / max(mains_total, 1.0))

    def fit_point(self):
        for k, d in self.pairs.items():
            self.point[k] = fit_binomial(d["X"], d["succ"], d["trials"], PEN)[0]
        self.pooled = np.mean([v for v in self.point.values()], axis=0)

    def draw_once(self, day_counts: np.ndarray):
        """One bootstrap replicate: day_counts[d] = times day d was resampled."""
        out = {}
        for k, d in self.pairs.items():
            c = day_counts[d["day"]]
            out[k] = fit_binomial(d["X"], d["succ"] * c, d["trials"] * c, PEN)[0]
        return out

    def finalize(self, replicates: list):
        for k in self.pairs:
            self.draws[k] = np.array([r[k] for r in replicates])
        self.pooled_draws = np.mean([self.draws[k] for k in self.pairs], axis=0)

    # ----- use ------------------------------------------------------------------
    def coefs(self, main, addon, a0_hint=None):
        """(S, NF) coefficient draws and a data_confidence flag for a pair."""
        if (main, addon) in self.draws:
            return self.draws[(main, addon)], "fitted"
        co = self.pooled_draws.copy()
        a = self.addon_attach_prior.get(addon)
        if a is not None:      # centre the pooled intercept on this add-on's overall attach level
            p = float(np.clip(a, 0.02, 0.6))
            co[:, 0] = co[:, 0] - np.mean(co[:, 0]) + np.log(p / (1 - p))
        return co, "pooled"

    @staticmethod
    def attach(co, disc10, ln_pa, dt_idx):
        eta = co[:, 0] + co[:, 1] * disc10 + co[:, 2] * ln_pa
        if dt_idx > 0:
            eta = eta + co[:, 2 + dt_idx]
        return 1.0 / (1.0 + np.exp(-eta))


def break_even_take_rate(main_price, main_cost, addon_price, addon_cost, combo_price, baseline_attach,
                         traffic_ratio=1.0):
    """Take rate at which a combo stops losing money (closed form, units: share of main buyers).

    Baseline profit per main buyer = main margin + baseline_attach * add-on margin.
    With the combo, each taker yields main + add-on margin less the discount; non-takers yield the main margin.
    traffic_ratio = main buyers with the combo / main buyers without (1 when the combo adds no traffic).
    Worked check: Rs70/45 main, Rs20/5 drink, 30% attach, Rs82 combo -> (29.5 - 25) / (32 - 25) = 0.643.
    """
    main_margin = main_price - main_cost
    addon_margin = addon_price - addon_cost
    discount = main_price + addon_price - combo_price
    base = main_margin + baseline_attach * addon_margin
    taker_gain = addon_margin - discount          # extra profit of a taker over a meal-only buyer
    if taker_gain <= 0:
        return 1.0
    t = (base / traffic_ratio - main_margin) / taker_gain
    return float(np.clip(t, 0.0, 1.0))
