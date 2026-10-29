"""The simulated campus world (generator and grader only; the serving path never imports this).

The menu, the student tiers (config/tier_params.yaml) and the behaviour parameters live here. The
generator samples from it; the grader asks it for the true expected demand and profit.
"""
import numpy as np
from scipy.stats import norm

from ..config import DAY_TYPES, load_tier_params

# item_id, name, kind, price, cost, portion_g, avg units/day target (mains only)
ITEM_SPECS = [
    ("veg_meals",       "Veg Meals",       "main",  70, 45, 350, 100),
    ("egg_fried_rice",  "Egg Fried Rice",  "main",  60, 36, 300,  45),
    ("chicken_biryani", "Chicken Biryani", "main",  90, 96, 350,  70),
    ("dosa",            "Dosa",            "main",  40, 24, 180, 120),
    ("chapati_kurma",   "Chapati Kurma",   "main",  50, 30, 250,  45),
    ("paneer_roll",     "Paneer Roll",     "main",  55, 57, 200,  40),
    ("salad_bowl",      "Salad Bowl",      "main",  65, 38, 200,  10),
    ("tea",             "Tea",             "addon", 12,  4, 150,   0),
    ("cold_coffee",     "Cold Coffee",     "addon", 40, 17, 250,   0),
    ("samosa",          "Samosa",          "addon", 15,  7,  80,   0),
    ("fresh_juice",     "Fresh Juice",     "addon", 45, 30, 250,   0),
]
MAIN_IDS = [s[0] for s in ITEM_SPECS if s[2] == "main"]
ADDON_IDS = [s[0] for s in ITEM_SPECS if s[2] == "addon"]

# True own-price elasticities the generator is tuned to reproduce (inside the Kaggle range -1.6 .. -3.2)
TARGET_ELASTICITY = {
    "veg_meals": -2.4, "egg_fried_rice": -2.7, "chicken_biryani": -2.3, "dosa": -1.7, "chapati_kurma": -2.2,
    "paneer_roll": -2.9, "salad_bowl": -3.1, "tea": -1.6, "cold_coffee": -2.2, "samosa": -2.4, "fresh_juice": -3.1,
}
# True portion effect (elasticity of demand to portion) for mains; add-ons do not respond to portion
TRUE_PORTION = {"veg_meals": 0.7, "egg_fried_rice": 0.6, "chicken_biryani": 0.7, "dosa": 0.5,
                "chapati_kurma": 0.6, "paneer_roll": 0.6, "salad_bowl": 0.5}

# combo_id, name, main, addon, current discount %, attach-lift kappa (logit per 10%), main traffic lift lambda
COMBO_SPECS = [
    ("combo_veg_tea", "Veg Meals + Tea", "veg_meals", "tea", 0.0, 0.90, 0.12),
    ("combo_dosa_cc", "Dosa + Cold Coffee", "dosa", "cold_coffee", 10.0, 0.25, 0.03),
    ("combo_bir_juice", "Chicken Biryani + Fresh Juice", "chicken_biryani", "fresh_juice", 5.0, 0.40, 0.30),
]

# Target share of each main's buyers adding (tea, cold_coffee, samosa, fresh_juice); "__skip__" = no main
ATTACH_TARGET = {
    "veg_meals":       (0.25, 0.06, 0.08, 0.010),
    "egg_fried_rice":  (0.12, 0.10, 0.10, 0.010),
    "chicken_biryani": (0.06, 0.08, 0.04, 0.060),
    "dosa":            (0.10, 0.55, 0.08, 0.005),
    "chapati_kurma":   (0.20, 0.05, 0.10, 0.010),
    "paneer_roll":     (0.15, 0.12, 0.15, 0.010),
    "salad_bowl":      (0.05, 0.05, 0.002, 0.150),
    "__skip__":        (0.12, 0.05, 0.08, 0.002),
}
DT_TASTE = {
    "regular": {},
    "exam":    {"tea": 0.30, "cold_coffee": 0.25, "samosa": 0.20, "dosa": 0.10},
    "weekend": {"chicken_biryani": 0.30, "egg_fried_rice": 0.15, "fresh_juice": 0.20},
    "event":   {"samosa": 0.25, "cold_coffee": 0.20, "chicken_biryani": 0.15},
}
DAYS = 120
RANDOMISED_FROM = 60
EXAM_BLOCKS = [(28, 41), (84, 97)]
EVENT_DAYS = {9, 20, 50, 66, 79, 100, 111}


def day_type_of(day: int) -> str:
    if day % 7 in (5, 6):
        return "weekend"
    if day in EVENT_DAYS:
        return "event"
    if any(a <= day <= b for a, b in EXAM_BLOCKS):
        return "exam"
    return "regular"


def day_type_freq() -> dict:
    counts = {dt: 0 for dt in DAY_TYPES}
    for d in range(DAYS):
        counts[day_type_of(d)] += 1
    return {dt: c / DAYS for dt, c in counts.items()}


def cost_at(cost_ref, portion, portion_ref):
    """Unit cost when the portion changes: base_cost * (portion/ref)^0.8."""
    return cost_ref * (portion / portion_ref) ** 0.8


class World:
    def __init__(self, tier_params=None):
        tp = tier_params or load_tier_params()
        self.tiers = list(tp["tiers"].keys())
        self.budget_median = {t: float(v["budget_median"]) for t, v in tp["tiers"].items()}
        self.sens = {t: float(v["price_sensitivity"]) for t, v in tp["tiers"].items()}
        self.sigma = float(tp["budget_sigma"])
        self.footfall = {dt: float(tp["day_types"][dt]["footfall"]) for dt in DAY_TYPES}
        self.mix = {dt: {t: float(tp["day_types"][dt]["shares"][t]) for t in self.tiers} for dt in DAY_TYPES}

        self.item_ids = [s[0] for s in ITEM_SPECS]
        self.idx = {k: i for i, k in enumerate(self.item_ids)}
        self.main_idx = [self.idx[k] for k in MAIN_IDS]
        self.addon_idx = [self.idx[k] for k in ADDON_IDS]
        self.price_ref = np.array([s[3] for s in ITEM_SPECS], float)
        self.cost_ref = np.array([s[4] for s in ITEM_SPECS], float)
        self.portion_ref = np.array([s[5] for s in ITEM_SPECS], float)
        self.target = np.array([s[6] for s in ITEM_SPECS], float)
        self.slope = -np.array([TARGET_ELASTICITY[k] for k in self.item_ids])   # refined by calibrate()
        self.gamma = np.array([TRUE_PORTION.get(k, 0.0) for k in self.item_ids])
        self.combos = []
        for cid, name, m, a, d0, kappa, lam in COMBO_SPECS:
            self.combos.append(dict(combo_id=cid, name=name, main=self.idx[m], addon=self.idx[a],
                                    discount_pct=d0, kappa=kappa, lam=lam))
        self.freq = day_type_freq()
        nm, na = len(self.main_idx), len(self.addon_idx)
        self.taste = np.zeros(nm)
        self.U = np.zeros((nm + 1, na))
        self.attach_target = np.array([ATTACH_TARGET[k] for k in MAIN_IDS + ["__skip__"]], float)
        self.c_mi = [self.main_idx.index(c["main"]) for c in self.combos]
        self.c_ai = [self.addon_idx.index(c["addon"]) for c in self.combos]
        self.calibrate()

    # ----- expected behaviour ------------------------------------------------
    def dt_shift(self, dt):
        return np.array([DT_TASTE[dt].get(k, 0.0) for k in self.item_ids])

    def tier_choice(self, price, portion, disc, dt, t):
        """Choice probabilities of tier t: (p_main over mains+none, addon probs given main incl. none column)."""
        nm, na = len(self.main_idx), len(self.addon_idx)
        shift = self.dt_shift(dt)
        pm, pa = price[self.main_idx], price[self.addon_idx]
        kap = np.zeros((nm + 1, na))
        lam = np.zeros(nm)
        pair_disc = np.zeros((nm, na))
        for k, c in enumerate(self.combos):
            mi, ai = self.c_mi[k], self.c_ai[k]
            kap[mi, ai] = c["kappa"] * disc[k] / 10.0
            lam[mi] = c["lam"] * disc[k] / 10.0
            pair_disc[mi, ai] = disc[k] / 100.0
        pair_net = (pm[:, None] + pa[None, :]) * (1 - pair_disc)
        med, s, sens = self.budget_median[t], self.sigma, self.sens[t]

        def aff(p):
            return norm.sf((np.log(p) - np.log(med)) / s)

        u = (self.taste + shift[self.main_idx]
             - self.slope[self.main_idx] * sens * np.log(pm / self.price_ref[self.main_idx])
             + self.gamma[self.main_idx] * np.log(portion[self.main_idx] / self.portion_ref[self.main_idx]) + lam)
        w = np.concatenate([np.exp(u) * aff(pm), [1.0]])
        p_main = w / w.sum()
        v = (self.U + shift[self.addon_idx][None, :]
             - (self.slope[self.addon_idx] * sens * np.log(pa / self.price_ref[self.addon_idx]))[None, :] + kap)
        cond = np.ones((nm + 1, na))
        cond[:nm] = aff(pair_net) / np.maximum(aff(pm)[:, None], 1e-12)
        cond[nm] = aff(pa)
        wa = np.exp(v) * cond
        denom = 1.0 + wa.sum(axis=1, keepdims=True)
        return p_main, wa / denom, 1.0 / denom

    def expected(self, price, portion, disc, dt, shock=1.0):
        """Expected counts for one day: (main_units incl. none, pairs[(mains+none), addons], item_units)."""
        nm, na = len(self.main_idx), len(self.addon_idx)
        main_units = np.zeros(nm + 1)
        pairs = np.zeros((nm + 1, na))
        for t in self.tiers:
            n_t = self.footfall[dt] * self.mix[dt][t] * shock
            p_main, a_given, _ = self.tier_choice(price, portion, disc, dt, t)
            main_units += n_t * p_main
            pairs += n_t * p_main[:, None] * a_given
        item_units = np.zeros(len(self.item_ids))
        item_units[self.main_idx] = main_units[:nm]
        item_units[self.addon_idx] = pairs.sum(axis=0)
        return main_units, pairs, item_units

    def avg_item_units(self, price=None, portion=None, disc=None, mix=None):
        price = self.price_ref if price is None else price
        portion = self.portion_ref if portion is None else portion
        disc = np.zeros(len(self.combos)) if disc is None else disc
        tot = np.zeros(len(self.item_ids))
        for dt, f in (mix or self.freq).items():
            tot += f * self.expected(price, portion, disc, dt)[2]
        return tot

    def calibrate(self, outer=14, inner=25):
        """Tune tastes, attach utilities and price slopes until volumes, attach rates and elasticities hit target."""
        for _ in range(outer):
            self._calibrate_volumes(inner)
            truth = self.true_price_elasticity()
            for i, k in enumerate(self.item_ids):
                self.slope[i] += 0.9 * (truth[k] - TARGET_ELASTICITY[k])
        self._calibrate_volumes(60)

    def _calibrate_volumes(self, iters):
        nm = len(self.main_idx)
        zero = np.zeros(len(self.combos))
        for _ in range(iters):
            avg_main = np.zeros(nm + 1)
            avg_pairs = np.zeros((nm + 1, len(self.addon_idx)))
            for dt, f in self.freq.items():
                m, p, _ = self.expected(self.price_ref, self.portion_ref, zero, dt)
                avg_main += f * m
                avg_pairs += f * p
            self.taste += 0.7 * np.log(self.target[self.main_idx] / np.maximum(avg_main[:nm], 1e-6))
            att = avg_pairs / np.maximum(avg_main[:, None], 1e-6)
            self.U += 0.7 * np.log(self.attach_target / np.maximum(att, 1e-9))

    # ----- ground truth for grading --------------------------------------------
    def _log_slope(self, ref, i, h, key):
        up, dn = ref.copy(), ref.copy()
        up[i] *= 1 + h
        dn[i] *= 1 - h
        qu = self.avg_item_units(**{key: up})[i]
        qd = self.avg_item_units(**{key: dn})[i]
        return float((np.log(qu) - np.log(qd)) / (np.log(1 + h) - np.log(1 - h)))

    def true_price_elasticity(self, h=0.02):
        return {k: self._log_slope(self.price_ref, i, h, "price") for i, k in enumerate(self.item_ids)}

    def true_portion_effect(self, h=0.05):
        return {k: self._log_slope(self.portion_ref, i, h, "portion") for i, k in enumerate(self.item_ids)}

    def true_profit(self, price, portion, disc, mix=None):
        """True expected profit per day for a menu (grader only)."""
        cost = cost_at(self.cost_ref, portion, self.portion_ref)
        profit = 0.0
        for dt, f in (mix or self.freq).items():
            _, pairs, units = self.expected(price, portion, disc, dt)
            profit += f * float(((price - cost) * units).sum())
            for k, c in enumerate(self.combos):
                profit -= f * pairs[self.c_mi[k], self.c_ai[k]] * disc[k] / 100.0 * (price[c["main"]] + price[c["addon"]])
        return profit


_world = None


def get_world() -> World:
    global _world
    if _world is None:
        _world = World()
    return _world
