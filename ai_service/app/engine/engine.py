"""Evaluates menus (prices, portions, combo discounts) across every bootstrap draw.

All ranges are mean / p10 / p90 over draws; every comparison against Today uses the same draws, so
probabilities such as "profit below Today" are paired.
"""
from dataclasses import dataclass, field

import numpy as np
import pandas as pd

from ..config import (DAY_TYPES, ARTIFACT_DIR, SYNTH_DIR, PORTION_TIER_MULT, Guardrails)
from ..models.combo import ComboModel, break_even_take_rate
from ..models.demand import DemandBundle
from ..models.student import StudentLayer, portion_ladder, price_per_100g

COST_EXPONENT = 0.8


@dataclass
class Menu:
    price: np.ndarray
    portion: np.ndarray
    disc: np.ndarray            # combo discount %, per combo
    offer: np.ndarray           # stand-alone discount %, per item (items outside a combo)

    def copy(self):
        return Menu(self.price.copy(), self.portion.copy(), self.disc.copy(), self.offer.copy())


@dataclass
class Combo:
    combo_id: str
    name: str
    main: int
    addon: int
    coefs: np.ndarray = None
    confidence: str = "fitted"


def rng_stats(a):
    a = np.asarray(a, float)
    return dict(mean=float(a.mean()), p10=float(np.percentile(a, 10)), p90=float(np.percentile(a, 90)))


class Engine:
    def __init__(self, bundle: DemandBundle, combo_model: ComboModel, student: StudentLayer, items: pd.DataFrame,
                 sales: pd.DataFrame, store):
        self.bundle, self.cm, self.student, self.store = bundle, combo_model, student, store
        self.ids = bundle.item_ids
        self.n = len(self.ids)
        self.idx = bundle.idx
        self.kinds = bundle.kinds
        self.names = dict(zip(items.item_id, items.name))
        self.price_ref, self.portion_ref, self.cost_ref = bundle.price_ref, bundle.portion_ref, bundle.cost_ref
        self.S = bundle.n_draws
        self.mains = [i for i, k in enumerate(self.kinds) if k == "main"]
        self.addons = [i for i, k in enumerate(self.kinds) if k == "addon"]
        crow = items[items.kind == "combo"]
        self.combos = []
        for _, r in crow.iterrows():
            m, a = r["combo_items"].split("+")
            self.combos.append(Combo(r["item_id"], r["name"], self.idx[m], self.idx[a]))
        self.combo_seed_disc = {r["item_id"]: float(r["discount_pct"]) for _, r in crow.iterrows()}
        self.item_combo = {}
        for c, cb in enumerate(self.combos):
            self.item_combo[cb.main] = c
            self.item_combo[cb.addon] = c
        for cb in self.combos:
            cb.coefs, cb.confidence = self.cm.coefs(self.ids[cb.main], self.ids[cb.addon])
        # observed history: units per day and the training day-type mix
        flat = sales[sales["combo"] == "no"]
        self.units_per_day = flat.groupby("item_id")["qty_sold"].mean().to_dict()
        days = flat.drop_duplicates("day_index")["day_type"].value_counts(normalize=True)
        self.default_mix = {d: float(days.get(d, 0.0)) for d in DAY_TYPES}
        self.trained_through = str(sales["date"].max())
        self.items_df = items
        self._seed_state(items)
        self.main_weights = self._popularity()

    # ----- state -------------------------------------------------------------
    def _seed_state(self, items):
        ms, cs = self.store.menu_state()
        if not ms:
            base = items[items.kind != "combo"]
            self.store.seed_menu([(r.item_id, float(r.price), int(r.portion_size_g)) for r in base.itertuples()],
                                 [(cb.combo_id, self.combo_seed_disc[cb.combo_id]) for cb in self.combos])

    def reset_state(self):
        ms, _ = self.store.menu_state()
        self.store.seed_menu([(r.item_id, float(r.price), int(r.portion_size_g))
                              for r in self.items_df[self.items_df.kind != "combo"].itertuples()],
                             [(cb.combo_id, self.combo_seed_disc[cb.combo_id]) for cb in self.combos])

    def today(self) -> Menu:
        ms, cs = self.store.menu_state()
        price = np.array([ms[k]["price"] for k in self.ids], float)
        portion = np.array([ms[k]["portion_size_g"] for k in self.ids], float)
        disc = np.array([cs.get(cb.combo_id, 0.0) for cb in self.combos], float)
        return Menu(price, portion, disc, np.zeros(self.n))

    def guardrails(self) -> Guardrails:
        return self.store.get_guardrails()

    def mix(self, m=None):
        if not m:
            return dict(self.default_mix)
        tot = sum(m.get(d, 0.0) for d in DAY_TYPES)
        return {d: m.get(d, 0.0) / tot for d in DAY_TYPES}

    # ----- core evaluation -------------------------------------------------------
    def cost(self, portion):
        return self.cost_ref * (portion / self.portion_ref) ** COST_EXPONENT

    def evaluate(self, menu: Menu, mix: dict):
        b = self.bundle.draws
        net = menu.price * (1 - menu.offer / 100.0)
        d10 = np.zeros(self.n)
        for c, cb in enumerate(self.combos):
            d10[cb.main] = d10[cb.addon] = menu.disc[c] / 10.0
        lnp = np.log(net / self.price_ref)
        lnq = np.log(menu.portion / self.portion_ref)
        base = b["beta"] * lnp + b["pi"] * lnq + b["phi"] * d10
        units = np.zeros((self.S, self.n))
        pairs = np.zeros((self.S, len(self.combos)))
        for k, dt in enumerate(DAY_TYPES):
            w = mix.get(dt, 0.0)
            if w <= 0:
                continue
            u = np.exp(b["alpha"][:, :, k] + base)
            units += w * u
            for c, cb in enumerate(self.combos):
                att = ComboModel.attach(cb.coefs, menu.disc[c] / 10.0, np.log(net[cb.addon] / self.price_ref[cb.addon]), k)
                pairs[:, c] += w * np.minimum(u[:, cb.main] * att, u[:, cb.addon])
        cost = self.cost(menu.portion)
        alloc = np.zeros((self.S, self.n))
        for c, cb in enumerate(self.combos):
            f = pairs[:, c] * menu.disc[c] / 100.0
            alloc[:, cb.main] += f * menu.price[cb.main]
            alloc[:, cb.addon] += f * menu.price[cb.addon]
        item_rev = units * net[None, :] - alloc
        item_profit = units * (net - cost)[None, :] - alloc
        return dict(units=units, pairs=pairs, item_rev=item_rev, item_profit=item_profit,
                    revenue=item_rev.sum(1), profit=item_profit.sum(1), total_units=units.sum(1),
                    grams=(units * menu.portion[None, :]).sum(1), menu=menu)

    # ----- student layer ---------------------------------------------------------------
    def pair_prices(self, menu: Menu):
        out = []
        for m in self.mains:
            best = np.inf
            for a in self.addons:
                p = menu.price[m] + menu.price[a]
                c = self.item_combo.get(m)
                if c is not None and self.combos[c].addon == a:
                    p *= 1 - menu.disc[c] / 100.0
                best = min(best, p)
            out.append(best)
        return out

    def coverage(self, menu: Menu, mix=None):
        return self.student.coverage(self.pair_prices(menu), self.main_weights, mix or self.default_mix)

    def _popularity(self):
        ms, _ = self.store.menu_state()
        menu = Menu(self.price_ref.copy(), self.portion_ref.copy(), np.zeros(len(self.combos)), np.zeros(self.n))
        u = self.evaluate(menu, self.default_mix)["units"].mean(0)[self.mains]
        return u / u.sum()

    # ----- menu health (rules, no model) -------------------------------------------------
    def health(self):
        t = self.today()
        by_kind = {}
        for i, k in enumerate(self.kinds):
            by_kind.setdefault(k, []).append(self.units_per_day.get(self.ids[i], 0.0))
        med = {k: float(np.median(v)) for k, v in by_kind.items()}
        q75 = {k: float(np.percentile(v, 75)) for k, v in by_kind.items()}
        rows = []
        for i, key in enumerate(self.ids):
            price, cost = float(t.price[i]), float(self.cost(t.portion)[i])
            u = self.units_per_day.get(key, 0.0)
            margin_abs = price - cost
            margin_pct = margin_abs / price * 100.0
            flags = []
            if cost > price:
                flags.append("loss_maker")
            elif u < 0.25 * med[self.kinds[i]]:
                flags.append("poor_seller")
            if margin_pct >= 35.0 and u >= q75[self.kinds[i]] and "loss_maker" not in flags:
                flags.append("star")
            rows.append(dict(item_id=key, name=self.names[key], kind=self.kinds[i], price=price, cost=cost,
                             portion_size_g=int(t.portion[i]), units_per_day=float(u), margin_abs=margin_abs,
                             margin_pct=margin_pct, flags=flags,
                             portion_tiers=portion_ladder(price, int(t.portion[i]), cost, PORTION_TIER_MULT)))
        return rows

    def combos_view(self):
        t = self.today()
        return [dict(combo_id=cb.combo_id, combo_items=[self.ids[cb.main], self.ids[cb.addon]],
                     discount_pct=float(t.disc[c])) for c, cb in enumerate(self.combos)]

    # ----- guardrail flags --------------------------------------------------------------------
    def item_flags(self, i, price, portion, today: Menu, g: Guardrails):
        flags = []
        cost = float(self.cost(np.where(np.arange(self.n) == i, portion, today.portion))[i])
        margin = (price - cost) / price * 100.0
        cur_margin = (today.price[i] - float(self.cost(today.portion)[i])) / today.price[i] * 100.0
        if margin < g.margin_floor_pct:
            flags.append("below_margin_floor")
        if price > g.student_price_cap:
            flags.append("above_student_cap")
        if abs(price / today.price[i] - 1) * 100.0 > g.max_weekly_change_pct + 1e-9:
            flags.append("change_too_large")
        return flags, margin

    # ----- /predict ----------------------------------------------------------------------------------
    def predict(self, item_id, price, portion, discount_pct, day_type):
        i = self.idx[item_id]
        g = self.guardrails()
        today = self.today()
        mix = {d: 1.0 if d == day_type else 0.0 for d in DAY_TYPES}
        menu = today.copy()
        menu.price[i], menu.portion[i] = price, portion
        c = self.item_combo.get(i)
        if c is not None:
            menu.disc[c] = discount_pct
        else:
            menu.offer[i] = discount_pct
        out, base = self.evaluate(menu, mix), self.evaluate(today, mix)
        flags, margin = self.item_flags(i, price, portion, today, g)
        if g.fairness_mode and day_type in ("exam", "event") and price > today.price[i] + 1e-9:
            flags.append("surge_on_exam_event")
        net = price * (1 - menu.offer[i] / 100.0)
        margin = (net - float(self.cost(menu.portion)[i])) / net * 100.0
        curve = []
        for step in np.linspace(-0.15, 0.15, 13):
            m2 = menu.copy()
            m2.price[i] = round(today.price[i] * (1 + step) * 2) / 2
            o = self.evaluate(m2, mix)
            curve.append(dict(price=float(m2.price[i]), units_mean=float(o["units"][:, i].mean()),
                              profit_mean=float(o["item_profit"][:, i].mean()),
                              profit_p10=float(np.percentile(o["item_profit"][:, i], 10)),
                              profit_p90=float(np.percentile(o["item_profit"][:, i], 90))))
        return dict(units=rng_stats(out["units"][:, i]), revenue=rng_stats(out["item_rev"][:, i]),
                    profit=rng_stats(out["item_profit"][:, i]), margin_pct=float(margin),
                    price_effect=rng_stats(self.bundle.draws["beta"][:, i]),
                    baseline=dict(units=float(base["units"][:, i].mean()), revenue=float(base["item_rev"][:, i].mean()),
                                  profit=float(base["item_profit"][:, i].mean())),
                    curve=curve, flags=flags)

    # ----- /scenarios/compare ------------------------------------------------------------------------------
    def scenario_menu(self, sc, today: Menu):
        m = today.copy()
        for ch in sc.get("item_changes", []):
            i = self.idx[ch["item_id"]]
            if ch.get("price") is not None:
                m.price[i] = ch["price"]
            if ch.get("portion_size_g") is not None:
                m.portion[i] = ch["portion_size_g"]
        cid = {cb.combo_id: c for c, cb in enumerate(self.combos)}
        for ch in sc.get("combo_changes", []):
            m.disc[cid[ch["combo_id"]]] = ch["discount_pct"]
        return m

    def summarize(self, out, today_out, mix, g, today: Menu, name):
        menu = out["menu"]
        flags = []
        for i in range(self.n):
            if abs(menu.price[i] - today.price[i]) > 1e-9 or abs(menu.portion[i] - today.portion[i]) > 1e-9:
                f, _ = self.item_flags(i, menu.price[i], menu.portion[i], today, g)
                flags += [x for x in f if x not in flags]
        if (menu.disc > g.combo_discount_cap_pct + 1e-9).any() and "combo_discount_above_cap" not in flags:
            flags.append("combo_discount_above_cap")
        cov = self.coverage(menu, mix)
        if cov["overall"] < g.coverage_target - 1e-9:
            flags.append("below_coverage_target")
        rev_mean = float(out["revenue"].mean())
        return dict(name=name, units=rng_stats(out["total_units"]), revenue=rng_stats(out["revenue"]),
                    profit=rng_stats(out["profit"]),
                    margin_pct=float(out["profit"].mean() / rev_mean * 100.0) if rev_mean else 0.0,
                    coverage=cov, price_per_100g=price_per_100g(rev_mean, float(out["grams"].mean())),
                    risk_prob_below_today=float((out["profit"] < today_out["profit"] - 1e-9).mean()),
                    delta_vs_today=dict(units=float((out["total_units"] - today_out["total_units"]).mean()),
                                        revenue=float((out["revenue"] - today_out["revenue"]).mean()),
                                        profit=float((out["profit"] - today_out["profit"]).mean())),
                    flags=flags)

    def compare(self, scenarios, day_type_mix=None):
        g, today, mix = self.guardrails(), self.today(), self.mix(day_type_mix)
        t_out = self.evaluate(today, mix)
        results = [self.summarize(t_out, t_out, mix, g, today, "Today")]
        for sc in scenarios:
            menu = sc.get("_menu") or self.scenario_menu(sc, today)
            results.append(self.summarize(self.evaluate(menu, mix), t_out, mix, g, today, sc["name"]))
        return results

    # ----- combos ----------------------------------------------------------------------------------------------------
    def _combo_pair(self, main_id, addon_id):
        im, ia = self.idx[main_id], self.idx[addon_id]
        for c, cb in enumerate(self.combos):
            if cb.main == im and cb.addon == ia:
                return c, cb
        return None, None

    def combo_status(self, inc, conf, discount, today, im, ia, g):
        """Gate for a combo: returns (status, reason, prob)."""
        from .gate import gate
        prob = float((inc > 0).mean())
        reasons = []
        cost = self.cost(today.portion)
        for i in (im, ia):
            m = (today.price[i] - cost[i]) / today.price[i] * 100.0
            if cost[i] > today.price[i]:
                return "hold", f"{self.names[self.ids[i]]} is sold below cost; a discount would be spent on a loss-maker.", prob
            if m < g.margin_floor_pct:
                return "hold", f"{self.names[self.ids[i]]} is below the {g.margin_floor_pct:.0f}% margin floor; fix its price first.", prob
        if discount <= 0:
            return "hold", "No discount selected: a plain menu earns more than any discounted pairing.", prob
        if discount > g.combo_discount_cap_pct + 1e-9:
            return "hold", f"Discount is above the {g.combo_discount_cap_pct:.0f}% cap.", prob
        status = gate(prob, float(inc.mean()))
        if conf == "pooled" and status == "apply":
            status = "pilot"
            reasons.append("pair has no combo history, so it is capped at Pilot")
        if status == "apply":
            return status, "Adds profit in at least 80% of model draws.", prob
        if status == "pilot":
            return status, ("Likely adds profit but the range is wide; test for a week" +
                            (f" ({reasons[0]})." if reasons else ".")), prob
        return status, "Profit gain is not reliable enough (or negative): leave this pairing alone.", prob

    def combo_eval(self, main_id, addon_id, discount, day_type, today=None, g=None, as_dict=True):
        g, today = g or self.guardrails(), today or self.today()
        im, ia = self.idx[main_id], self.idx[addon_id]
        mix = {d: 1.0 if d == day_type else 0.0 for d in DAY_TYPES}
        c, cb = self._combo_pair(main_id, addon_id)
        if cb is None:
            cb = Combo("adhoc", "", im, ia)
            cb.coefs, cb.confidence = self.cm.coefs(main_id, addon_id)
        # evaluate with a temporary combo list so any pair can be tested
        saved, saved_ic = self.combos, self.item_combo
        try:
            others = [x for x in self.combos if x.combo_id != cb.combo_id and x.main != im and x.addon != ia
                      and x.main != ia and x.addon != im]
            self.combos = others + [cb]
            self.item_combo = {}
            for k, x in enumerate(self.combos):
                self.item_combo[x.main] = self.item_combo[x.addon] = k
            def menu_with(d):
                m = today.copy()
                m.disc = np.array([today.disc[saved.index(x)] if x in saved else 0.0 for x in others] + [d], float)
                return m
            m0, m1 = menu_with(0.0), menu_with(discount)
            o0, o1 = self.evaluate(m0, mix), self.evaluate(m1, mix)
            k = len(self.combos) - 1
            d_i = DAY_TYPES.index(day_type)
            ln_pa = np.log(today.price[ia] / self.price_ref[ia])
            att1 = ComboModel.attach(cb.coefs, discount / 10.0, ln_pa, d_i)
            att0 = ComboModel.attach(cb.coefs, 0.0, ln_pa, d_i)
        finally:
            self.combos, self.item_combo = saved, saved_ic
        inc = (o1["profit"] - o0["profit"])
        cost = self.cost(today.portion)
        combo_price = (today.price[im] + today.price[ia]) * (1 - discount / 100.0)
        ratio = float(o1["units"][:, im].mean() / o0["units"][:, im].mean())
        be = break_even_take_rate(today.price[im], cost[im], today.price[ia], cost[ia], combo_price,
                                  float(att0.mean()), ratio)
        status, reason, prob = self.combo_status(inc, cb.confidence, discount, today, im, ia, g)
        pairs1 = np.maximum(o1["pairs"][:, k], 1e-9)
        cann = float(np.clip(o0["pairs"][:, k] / pairs1, 0, 1).mean()) if discount > 0 else 0.0
        res = dict(take_rate=rng_stats(att1), addon_lift=float((o1["units"][:, ia] - o0["units"][:, ia]).mean()),
                   main_traffic_lift=float((o1["units"][:, im] - o0["units"][:, im]).mean()),
                   cannibalised_share=cann, break_even_take_rate=be, incremental_profit_per_day=rng_stats(inc),
                   prob_profit_improves=prob, status=status, reason=reason, data_confidence=cb.confidence)
        return (res, inc) if not as_dict else res

    def combo_suggestions(self):
        g, today = self.guardrails(), self.today()
        mix_day = "regular"
        rows = []
        for m in self.mains:
            for a in self.addons:
                best = None
                for d in (0.0, 5.0, 10.0, 15.0):
                    if d > g.combo_discount_cap_pct + 1e-9:
                        continue
                    res, inc = self.combo_eval(self.ids[m], self.ids[a], d, mix_day, today, g, as_dict=False)
                    if best is None or inc.mean() > best[1].mean():
                        best = (d, inc, res)
                d, inc, res = best
                if d == 0.0:
                    res = dict(res, status="hold", reason="No discount beats selling without a combo.")
                    d_out, inc_out = 0.0, inc
                else:
                    d_out, inc_out = d, inc
                rows.append(dict(main_item_id=self.ids[m], addon_item_id=self.ids[a], best_discount_pct=d_out,
                                 incremental_profit_per_day=rng_stats(inc_out), status=res["status"],
                                 reason=res["reason"], data_confidence=res["data_confidence"]))
        defined = {(self.ids[cb.main], self.ids[cb.addon]) for cb in self.combos}
        rows.sort(key=lambda r: (not ((r["main_item_id"], r["addon_item_id"]) in defined),
                                 -r["incremental_profit_per_day"]["mean"]))
        keep = [r for r in rows if (r["main_item_id"], r["addon_item_id"]) in defined]
        keep += [r for r in rows if (r["main_item_id"], r["addon_item_id"]) not in defined
                 and r["status"] != "hold"][:9]
        return keep
