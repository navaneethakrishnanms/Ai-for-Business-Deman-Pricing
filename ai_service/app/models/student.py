"""Layer 3 (rules, no ML): student budget tiers, coverage and Rs per 100 g.

A complete meal is one main plus one add-on. Coverage of a tier = share of that tier's students whose
budget covers a complete meal, averaged over mains by how popular each main is (so every main price
matters, in proportion to how many students choose it). Budgets are lognormal per tier
(config/tier_params.yaml).
"""
import numpy as np
from scipy.stats import norm

from ..config import DAY_TYPES, load_tier_params


class StudentLayer:
    def __init__(self, params=None):
        p = params or load_tier_params()
        self.tiers = list(p["tiers"].keys())
        self.median = {t: float(v["budget_median"]) for t, v in p["tiers"].items()}
        self.sens = {t: float(v["price_sensitivity"]) for t, v in p["tiers"].items()}
        self.sigma = float(p["budget_sigma"])
        self.footfall = {d: float(p["day_types"][d]["footfall"]) for d in DAY_TYPES}
        self.shares = {d: {t: float(p["day_types"][d]["shares"][t]) for t in self.tiers} for d in DAY_TYPES}
        self.source = p.get("source", "")

    def afford(self, tier, price):
        """Share of the tier whose budget is at least price."""
        return float(norm.sf((np.log(np.maximum(price, 1e-6)) - np.log(self.median[tier])) / self.sigma))

    def mix_share(self, tier, mix):
        return sum(mix[d] * self.shares[d][tier] for d in DAY_TYPES)

    def coverage(self, main_pair_prices, weights, mix):
        """main_pair_prices[m]: cheapest complete-meal price for main m; weights[m]: popularity (sums to 1)."""
        per = {}
        for t in self.tiers:
            per[t] = float(sum(w * self.afford(t, p) for w, p in zip(weights, main_pair_prices)))
        tot = sum(self.mix_share(t, mix) for t in self.tiers)
        overall = sum(self.mix_share(t, mix) * per[t] for t in self.tiers) / tot
        return dict(overall=float(overall), **per)


def price_per_100g(price, grams):
    return float(price / grams * 100.0) if grams else 0.0


def portion_ladder(price, portion_g, cost, mults, exponent=0.7):
    """Visible portion tiers; price scales with portion^0.7 so a larger plate is better value per 100 g."""
    out = []
    for tier, m in mults.items():
        g = int(round(portion_g * m / 5.0) * 5)
        pr = price if m == 1.0 else round(price * m ** exponent * 2) / 2
        out.append(dict(tier=tier, portion_size_g=g, price=float(pr), price_per_100g=round(price_per_100g(pr, g), 2)))
    return out
