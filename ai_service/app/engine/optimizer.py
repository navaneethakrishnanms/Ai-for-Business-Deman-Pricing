"""Layer 5: coordinate-search optimiser.

Sweeps item price (±15%, weekly cap), portion tiers, and combo discounts to maximise expected daily
profit subject to guardrails and a coverage target. Produces up to 8 recommendations (one per item or
combo), each with a gate decision and an optional pilot plan.

Also sweeps coverage_target to produce the profit-vs-affordability frontier.
"""
from __future__ import annotations

import uuid
from typing import Optional

import numpy as np

from ..config import (
    DAY_TYPES, PRICE_GRID, COMBO_DISCOUNTS, PORTION_TIER_MULT, APPLY_PROB, Guardrails,
)
from .gate import gate, pilot_plan as _pilot_plan, PILOT_MIN_PROB

MAX_RECS = 8
FRONTIER_STEPS = 9   # coverage targets 0.50 .. 0.90


def _coverage_targets():
    return np.linspace(0.50, 0.95, FRONTIER_STEPS).tolist()


class Optimizer:
    """Coordinate search over the menu."""

    def __init__(self, engine):
        self.eng = engine

    # ------------------------------------------------------------------ helpers
    def _week_cap(self, i, price_new, today_price, g: Guardrails):
        return abs(price_new / today_price - 1.0) * 100.0 <= g.max_weekly_change_pct + 1e-9

    def _margin_ok(self, i, price, portion, g: Guardrails):
        cost = float(self.eng.cost(np.where(np.arange(self.eng.n) == i, portion, self.eng.today().portion))[i])
        return (price - cost) / price * 100.0 >= g.margin_floor_pct - 1e-9

    def _coverage_ok(self, menu, g: Guardrails, mix, target=None):
        cov = self.eng.coverage(menu, mix)
        base_cov = self.eng.coverage(self.eng.today(), mix)["overall"]
        req = min(target if target is not None else g.coverage_target, base_cov)
        return cov["overall"] >= req - 1e-9, cov

    def _fairness_ok(self, i, price_new, today, g: Guardrails, mix):
        """Block an item price increase that would push tight-tier exam-day coverage below target."""
        if not g.fairness_mode:
            return True
        if price_new <= today.price[i] + 1e-9:
            return True
        menu_test = today.copy()
        menu_test.price[i] = price_new
        exam_mix = {d: 1.0 if d == "exam" else 0.0 for d in DAY_TYPES}
        cov = self.eng.coverage(menu_test, exam_mix)
        return cov.get("tight", 1.0) >= g.coverage_target - 1e-9

    # ------------------------------------------------------------------ item optimisation
    def best_price(self, i, today, g: Guardrails, mix, coverage_target=None):
        best_price, best_profit = today.price[i], -np.inf
        for step in PRICE_GRID:
            p = round(today.price[i] * (1 + step) * 2) / 2
            if p <= 0:
                continue
            if not self._week_cap(i, p, today.price[i], g):
                continue
            if p > g.student_price_cap + 1e-9:
                continue
            if not self._margin_ok(i, p, today.portion[i], g):
                continue
            if not self._fairness_ok(i, p, today, g, mix):
                continue
            menu = today.copy()
            menu.price[i] = p
            ok, _ = self._coverage_ok(menu, g, mix, coverage_target)
            if not ok:
                continue
            profit_draws = self.eng.evaluate(menu, mix)["profit"]
            pm = float(profit_draws.mean())
            if pm > best_profit:
                best_profit, best_price = pm, p
        return best_price

    def best_portion(self, i, today, g: Guardrails, mix, coverage_target=None):
        best_port, best_profit = today.portion[i], -np.inf
        for mult in PORTION_TIER_MULT.values():
            portion_g = round(self.eng.portion_ref[i] * mult / 5.0) * 5.0
            price_scaled = round(today.price[i] * mult ** 0.7 * 2) / 2
            if not self._week_cap(i, price_scaled, today.price[i], g):
                continue
            if not self._margin_ok(i, price_scaled, portion_g, g):
                continue
            menu = today.copy()
            menu.price[i], menu.portion[i] = price_scaled, portion_g
            ok, _ = self._coverage_ok(menu, g, mix, coverage_target)
            if not ok:
                continue
            profit_draws = self.eng.evaluate(menu, mix)["profit"]
            pm = float(profit_draws.mean())
            if pm > best_profit:
                best_profit, best_port = pm, portion_g
        return best_port

    # ------------------------------------------------------------------ recommend
    def recommend(self, coverage_target: Optional[float] = None,
                  day_type_mix: Optional[dict] = None,
                  include_frontier: bool = False) -> dict:
        g = self.eng.guardrails()
        today = self.eng.today()
        mix = self.eng.mix(day_type_mix)
        ct = coverage_target if coverage_target is not None else g.coverage_target
        t_out = self.eng.evaluate(today, mix)

        # ---- coordinate passes over items
        current = today.copy()
        for _pass in range(10):
            changed = False
            for i in range(self.eng.n):
                p = self.best_price(i, current, g, mix, ct)
                if abs(p - current.price[i]) > 1e-6:
                    current.price[i] = p
                    changed = True
                q = self.best_portion(i, current, g, mix, ct)
                if abs(q - current.portion[i]) > 1e-6:
                    current.portion[i] = q
                    changed = True
            if not changed:
                break

        # ---- combo discounts
        for c, cb in enumerate(self.eng.combos):
            best_d, best_p = current.disc[c], -np.inf
            for d in COMBO_DISCOUNTS:
                if d > g.combo_discount_cap_pct + 1e-9:
                    continue
                m = current.copy()
                m.disc[c] = d
                ok, _ = self._coverage_ok(m, g, mix, ct)
                if not ok:
                    continue
                pm = float(self.eng.evaluate(m, mix)["profit"].mean())
                if pm > best_p:
                    best_p, best_d = pm, d
            current.disc[c] = best_d

        # ---- build per-item/combo recommendations
        recs = []
        for i, key in enumerate(self.eng.ids):
            kind = self.eng.kinds[i]
            if kind == "combo":
                continue
            price_changed = abs(current.price[i] - today.price[i]) > 1e-6
            portion_changed = abs(current.portion[i] - today.portion[i]) > 1e-6
            if not price_changed and not portion_changed:
                continue

            menu_opt = today.copy()
            menu_opt.price[i], menu_opt.portion[i] = current.price[i], current.portion[i]
            out_opt = self.eng.evaluate(menu_opt, mix)
            inc = out_opt["profit"] - t_out["profit"]
            prob = float((inc > 0).mean())
            status = gate(prob, float(inc.mean()))

            flags, _ = self.eng.item_flags(i, current.price[i], current.portion[i], today, g)
            cost_new = float(self.eng.cost(np.where(np.arange(self.eng.n) == i, current.portion[i], today.portion))[i])
            m_pct = (current.price[i] - cost_new) / current.price[i] * 100.0

            reason_parts = []
            if price_changed:
                direction = "raise" if current.price[i] > today.price[i] else "lower"
                reason_parts.append(f"{direction} price from Rs {today.price[i]:.0f} to Rs {current.price[i]:.0f}")
            if portion_changed:
                direction = "increase" if current.portion[i] > today.portion[i] else "decrease"
                reason_parts.append(f"{direction} portion from {int(today.portion[i])} g to {int(current.portion[i])} g")
            reason_parts.append(f"estimated margin {m_pct:.0f}%, P(improve)={prob:.0%}")

            pp = _pilot_plan(key, "price" if price_changed else "portion",
                             float(current.price[i]), float(today.price[i]), mix) if status == "pilot" else None

            rec = dict(
                rec_id="rec_" + uuid.uuid4().hex[:10],
                kind="item",
                item_id=key,
                name=self.eng.names[key],
                proposed_price=float(current.price[i]),
                proposed_portion_g=int(current.portion[i]),
                current_price=float(today.price[i]),
                current_portion_g=int(today.portion[i]),
                incremental_profit=dict(
                    mean=float(inc.mean()),
                    p10=float(np.percentile(inc, 10)),
                    p90=float(np.percentile(inc, 90)),
                ),
                prob_improves=prob,
                status=status,
                reason="; ".join(reason_parts),
                guardrails_met=[f for f in ["margin_floor", "weekly_cap", "coverage", "fairness"] if f not in flags],
                flags=flags,
                pilot_plan=pp,
            )
            recs.append(rec)

        # ---- combo recommendations
        for c, cb in enumerate(self.eng.combos):
            disc = current.disc[c]
            if abs(disc - today.disc[c]) < 1e-6:
                continue
            res = self.eng.combo_eval(self.eng.ids[cb.main], self.eng.ids[cb.addon],
                                      disc, "regular", today, g)
            inc_mean = res["incremental_profit_per_day"]["mean"]
            prob = res["prob_profit_improves"]
            status = res["status"]
            pp = _pilot_plan(cb.combo_id, "combo", disc, float(today.disc[c]), mix) if status == "pilot" else None
            rec = dict(
                rec_id="rec_" + uuid.uuid4().hex[:10],
                kind="combo",
                combo_id=cb.combo_id,
                name=cb.name,
                proposed_discount_pct=float(disc),
                current_discount_pct=float(today.disc[c]),
                incremental_profit=res["incremental_profit_per_day"],
                prob_improves=prob,
                status=status,
                reason=res["reason"],
                guardrails_met=[],
                flags=[],
                pilot_plan=pp,
            )
            recs.append(rec)

        # keep at most MAX_RECS, prefer apply > pilot > hold
        order = {"apply": 0, "pilot": 1, "hold": 2}
        recs.sort(key=lambda r: (order[r["status"]], -r["incremental_profit"]["mean"]))
        recs = recs[:MAX_RECS]

        # summary
        n_apply = sum(1 for r in recs if r["status"] == "apply")
        n_pilot = sum(1 for r in recs if r["status"] == "pilot")
        apply_items = [r.get("name", r.get("combo_id", "")) for r in recs if r["status"] == "apply"]

        cov_opt = self.eng.coverage(current, mix)
        cov_today = self.eng.coverage(today, mix)

        summary = dict(
            total_recommendations=len(recs),
            apply_count=n_apply,
            pilot_count=n_pilot,
            hold_count=len(recs) - n_apply - n_pilot,
            apply_items=apply_items,
            coverage_today=cov_today["overall"],
            coverage_optimised=cov_opt["overall"],
            estimated_profit_delta=float(
                (self.eng.evaluate(current, mix)["profit"] - t_out["profit"]).mean()
            ),
        )

        result = dict(recommendations=recs, summary=summary)

        # ---- frontier (profit-vs-affordability)
        if include_frontier:
            frontier = []
            for ct_f in _coverage_targets():
                # quick single-pass (no full coordinate loop for speed)
                m_f = today.copy()
                for i in range(self.eng.n):
                    p = self.best_price(i, today, g, mix, ct_f)
                    m_f.price[i] = p
                out_f = self.eng.evaluate(m_f, mix)
                cov_f = self.eng.coverage(m_f, mix)
                frontier.append(dict(
                    coverage_target=round(ct_f, 2),
                    coverage_actual=round(cov_f["overall"], 3),
                    profit_mean=round(float(out_f["profit"].mean()), 1),
                    profit_p10=round(float(np.percentile(out_f["profit"], 10)), 1),
                    profit_p90=round(float(np.percentile(out_f["profit"], 90)), 1),
                ))
            result["frontier"] = frontier

        return result
