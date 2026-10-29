"""Layer 1: per-item log-linear count model with partial pooling, a hard price-effect bound and a
cluster bootstrap for ranges.

  units = ref_units[i, day_type] * (net_price / ref_price_i)^beta_i * (portion / ref_portion_i)^pi_i
          * exp(phi_i * combo_discount / 10)

  * beta_i = price effect, bounded to [-8, -0.05]: a price rise can never predict more demand.
  * Partial pooling: beta_i is pulled toward its category (main / add-on) mean mu_beta, and mu_beta is
    pulled toward the pooled Kaggle estimate (about -2.4, sd about 0.4). Same idea for pi_i.
  * Identification: beta, pi, phi come from the randomised test weeks (price_test = 1) only;
    ref_units uses every row. A naive fit on manager-set rows is kept to show why testing matters.
  * Ranges: cluster bootstrap over weeks of days (200 refits, fixed seed); draws are kept in memory and shared
    with the combo model, so scenario-vs-Today comparisons are paired.
"""
import json
import time
from dataclasses import dataclass

import numpy as np
import pandas as pd
from scipy.optimize import minimize

from ..config import DAY_TYPES, N_BOOT, SEED, ARTIFACT_DIR

D = len(DAY_TYPES)
BETA_MAX = -0.05
PRIOR_BETA = (-2.4, 0.4)       # replaced by data/kaggle_findings.json when present
PRIOR_PI = (0.3, 0.5)
TAU_PI = 0.25
TAU_PHI = 1.0
TAU_GRID = (0.3, 0.5, 0.8, 1.2)
BLOCK_DAYS = 7


@dataclass
class Rows:
    item: np.ndarray
    dt: np.ndarray
    lnp: np.ndarray       # ln(net price / ref price)
    lnq: np.ndarray       # ln(portion / ref portion)
    dsc: np.ndarray       # combo discount / 10
    y: np.ndarray
    test: np.ndarray      # price_test flag
    day: np.ndarray

    def subset(self, mask):
        return Rows(*(getattr(self, f)[mask] for f in ("item", "dt", "lnp", "lnq", "dsc", "y", "test", "day")))


def build_rows(sales: pd.DataFrame, item_ids, price_ref, portion_ref) -> Rows:
    df = sales[sales["combo"] == "no"]
    idx = {k: i for i, k in enumerate(item_ids)}
    item = df["item_id"].map(idx).to_numpy()
    return Rows(
        item=item,
        dt=df["day_type"].map({d: i for i, d in enumerate(DAY_TYPES)}).to_numpy(),
        lnp=np.log(df["price"].to_numpy() / np.asarray(price_ref)[item]),
        lnq=np.log(df["portion_size_g"].to_numpy() / np.asarray(portion_ref)[item]),
        dsc=df["discount_pct"].to_numpy() / 10.0,
        y=df["qty_sold"].to_numpy(float),
        test=df["price_test"].to_numpy(),
        day=df["day_index"].to_numpy(),
    )


class Layout:
    def __init__(self, n):
        self.n = n
        o = 0
        self.alpha = slice(o, o + n * D); o += n * D
        self.beta = slice(o, o + n); o += n
        self.pi = slice(o, o + n); o += n
        self.phi = slice(o, o + n); o += n
        self.mu_b = slice(o, o + 2); o += 2
        self.mu_p = slice(o, o + 2); o += 2
        self.size = o

    def bounds(self):
        b = [(-8, 10)] * (self.n * D) + [(-8, BETA_MAX)] * self.n + [(0.0, 2.5)] * self.n + [(-3, 3)] * self.n \
            + [(-8, BETA_MAX)] * 2 + [(-0.5, 2.5)] * 2
        return b


def _eta(theta, L, R: Rows, with_alpha=True):
    a = theta[L.alpha].reshape(L.n, D)
    eta = theta[L.beta][R.item] * R.lnp + theta[L.pi][R.item] * R.lnq + theta[L.phi][R.item] * R.dsc
    if with_alpha:
        eta = eta + a[R.item, R.dt]
    return eta


def _objective(theta, L, R, w, role, tau_b, prior_b, pt):
    eta = np.clip(_eta(theta, L, R), -20, 20)
    mu = np.exp(eta)
    nll = float((w * (mu - R.y * eta)).sum())
    r = w * (mu - R.y)
    g = np.zeros_like(theta)
    ga = np.bincount(R.item * D + R.dt, weights=r, minlength=L.n * D)
    g[L.alpha] = ga
    g[L.beta] = np.bincount(R.item, weights=r * R.lnp, minlength=L.n)
    g[L.pi] = np.bincount(R.item, weights=r * R.lnq, minlength=L.n)
    g[L.phi] = np.bincount(R.item, weights=r * R.dsc, minlength=L.n)
    beta, pi, phi = theta[L.beta], theta[L.pi], theta[L.phi]
    mu_b, mu_p = theta[L.mu_b], theta[L.mu_p]
    db = beta - mu_b[role] - pt["shift_b"]
    dp = pi - mu_p[role] - pt["shift_p"]
    dq = phi - pt["shift_f"]
    nll += 0.5 * (db ** 2).sum() / tau_b ** 2 + 0.5 * ((mu_b - pt["c_b"]) ** 2).sum() / prior_b[1] ** 2
    nll += 0.5 * (dp ** 2).sum() / TAU_PI ** 2 + 0.5 * ((mu_p - pt["c_p"]) ** 2).sum() / PRIOR_PI[1] ** 2
    nll += 0.5 * (dq ** 2).sum() / TAU_PHI ** 2
    g[L.beta] += db / tau_b ** 2
    g[L.pi] += dp / TAU_PI ** 2
    g[L.phi] += dq / TAU_PHI ** 2
    gmb = np.array([-(db[role == k]).sum() / tau_b ** 2 + (mu_b[k] - pt["c_b"][k]) / prior_b[1] ** 2 for k in (0, 1)])
    gmp = np.array([-(dp[role == k]).sum() / TAU_PI ** 2 + (mu_p[k] - pt["c_p"][k]) / PRIOR_PI[1] ** 2 for k in (0, 1)])
    g[L.mu_b] = gmb
    g[L.mu_p] = gmp
    return nll, g


def prior_centres(n, prior_b, rng=None, tau_b=None):
    """Prior centres. With rng, a random draw from the prior (randomise-then-optimise), so the bootstrap
    replicates also carry the uncertainty that shrinkage hides for thin items."""
    if rng is None:
        return dict(shift_b=np.zeros(n), shift_p=np.zeros(n), shift_f=np.zeros(n),
                    c_b=np.full(2, prior_b[0]), c_p=np.full(2, PRIOR_PI[0]))
    return dict(shift_b=rng.normal(0, tau_b, n), shift_p=rng.normal(0, TAU_PI, n), shift_f=rng.normal(0, TAU_PHI, n),
                c_b=rng.normal(prior_b[0], prior_b[1], 2), c_p=rng.normal(PRIOR_PI[0], PRIOR_PI[1], 2))


def fit_effects(R: Rows, w, role, tau_b, prior_b, theta0=None, maxiter=300, pt=None):
    """Stage 1: price, portion and combo effects from the rows given by weights w."""
    n = len(role)
    L = Layout(n)
    pt = pt or prior_centres(n, prior_b)
    if theta0 is None:
        theta0 = np.zeros(L.size)
        base = np.log((np.bincount(R.item * D + R.dt, weights=w * R.y, minlength=n * D) + 0.5)
                      / (np.bincount(R.item * D + R.dt, weights=w, minlength=n * D) + 1.0))
        theta0[L.alpha] = base
        theta0[L.beta] = prior_b[0]
        theta0[L.mu_b] = prior_b[0]
        theta0[L.pi] = 0.3
        theta0[L.mu_p] = 0.3
    res = minimize(_objective, theta0, args=(L, R, w, role, tau_b, prior_b, pt), jac=True, method="L-BFGS-B",
                   bounds=L.bounds(), options=dict(maxiter=maxiter))
    return res.x, L


def reference_levels(theta, L, R: Rows, w):
    """Stage 2: ref_units[i, day_type] from every row, given the fitted effects."""
    eta0 = _eta(theta, L, R, with_alpha=False)
    num = np.bincount(R.item * D + R.dt, weights=w * R.y, minlength=L.n * D)
    den = np.bincount(R.item * D + R.dt, weights=w * np.exp(eta0), minlength=L.n * D)
    return np.log((num + 0.5) / (den + 0.5)).reshape(L.n, D)


class DemandBundle:
    """Fitted point estimate plus bootstrap draws, with a vectorised units() over draws."""

    def __init__(self, item_ids, kinds, price_ref, portion_ref, cost_ref):
        self.item_ids = list(item_ids)
        self.kinds = list(kinds)
        self.n = len(self.item_ids)
        self.role = np.array([0 if k == "main" else 1 for k in kinds])
        self.price_ref = np.asarray(price_ref, float)
        self.portion_ref = np.asarray(portion_ref, float)
        self.cost_ref = np.asarray(cost_ref, float)
        self.idx = {k: i for i, k in enumerate(self.item_ids)}
        self.point = None       # dict alpha(n,D) beta pi phi
        self.draws = None       # dict alpha(S,n,D) beta(S,n) pi phi
        self.naive_beta = None
        self.meta = {}

    @property
    def n_draws(self):
        return self.draws["beta"].shape[0]

    def units(self, i, net_price, portion, disc10, dt_idx, draws=True):
        p = self.draws if draws else {k: v[None] for k, v in self.point.items()}
        eta = (p["alpha"][:, i, dt_idx] + p["beta"][:, i] * np.log(net_price / self.price_ref[i])
               + p["pi"][:, i] * np.log(portion / self.portion_ref[i]) + p["phi"][:, i] * disc10)
        return np.exp(eta)

    # ----- persistence -------------------------------------------------------
    def save(self, path=ARTIFACT_DIR):
        path.mkdir(parents=True, exist_ok=True)
        np.savez_compressed(path / "demand_model.npz",
                            **{f"point_{k}": v for k, v in self.point.items()},
                            **{f"draw_{k}": v for k, v in self.draws.items()},
                            naive_beta=self.naive_beta)
        meta = dict(item_ids=self.item_ids, kinds=self.kinds, price_ref=self.price_ref.tolist(),
                    portion_ref=self.portion_ref.tolist(), cost_ref=self.cost_ref.tolist(), meta=self.meta)
        (path / "demand_model.json").write_text(json.dumps(meta, indent=2))

    @classmethod
    def load(cls, path=ARTIFACT_DIR):
        m = json.loads((path / "demand_model.json").read_text())
        b = cls(m["item_ids"], m["kinds"], m["price_ref"], m["portion_ref"], m["cost_ref"])
        z = np.load(path / "demand_model.npz")
        b.point = {k: z[f"point_{k}"] for k in ("alpha", "beta", "pi", "phi")}
        b.draws = {k: z[f"draw_{k}"] for k in ("alpha", "beta", "pi", "phi")}
        b.naive_beta = z["naive_beta"]
        b.meta = m["meta"]
        return b


def _deviance(Rh, mu):
    return float(2 * np.sum(np.where(Rh.y > 0, Rh.y * np.log(np.maximum(Rh.y, 1e-9) / mu), 0) - (Rh.y - mu)))


def _fit_point(Rt, role, tau, prior_b, naive=False):
    w = (Rt.test == (0 if naive else 1)).astype(float)
    theta, L = fit_effects(Rt, w, role, tau, prior_b)
    theta[L.alpha] = reference_levels(theta, L, Rt, np.ones(len(Rt.y))).ravel()
    return theta, L


def select_tau(R: Rows, role, prior_b, folds=((72, 84), (84, 96)), grid=TAU_GRID):
    """Rolling-origin choice of the pooling strength, using only days before the final holdout."""
    scores = {}
    for tau in grid:
        tot = 0.0
        for lo, hi in folds:
            Rt = R.subset(R.day < lo)
            Rh = R.subset((R.day >= lo) & (R.day < hi))
            theta, L = _fit_point(Rt, role, tau, prior_b)
            tot += _deviance(Rh, np.exp(np.clip(_eta(theta, L, Rh), -20, 20)))
        scores[tau] = tot
    return min(scores, key=scores.get), scores


def holdout_validation(R: Rows, role, prior_b, holdout_from, tau):
    """Time-ordered validation: train on days < holdout_from, test on the rest."""
    Rt, Rh = R.subset(R.day < holdout_from), R.subset(R.day >= holdout_from)
    theta, L = _fit_point(Rt, role, tau, prior_b)
    mu = np.exp(np.clip(_eta(theta, L, Rh), -20, 20))
    wape = float(np.abs(Rh.y - mu).sum() / Rh.y.sum())
    big = np.abs(Rh.lnp) >= np.log(1.05)

    def hit_rate(th, Lx):
        mu_ref = np.exp(np.clip(_eta(th, Lx, Rh) - th[Lx.beta][Rh.item] * Rh.lnp, -20, 20))
        return float(np.where(Rh.lnp > 0, Rh.y < mu_ref, Rh.y > mu_ref)[big].mean())

    avg = np.bincount(Rt.item, weights=Rt.y, minlength=L.n) / np.bincount(Rt.item, minlength=L.n)
    wape_avg = float(np.abs(Rh.y - avg[Rh.item]).sum() / Rh.y.sum())
    thn, Ln = _fit_point(Rt, role, tau, prior_b, naive=True)
    return dict(tau_beta=tau, holdout_from_day=int(holdout_from), n_holdout_rows=int(len(Rh.y)),
                n_direction_rows=int(big.sum()), holdout_direction_hit_rate=hit_rate(theta, L),
                holdout_direction_hit_rate_naive=hit_rate(thn, Ln),
                holdout_unit_wape=wape, holdout_unit_wape_item_average=wape_avg)


def fit_bundle(sales, item_ids, kinds, price_ref, portion_ref, cost_ref, prior_b=PRIOR_BETA, n_boot=N_BOOT,
               seed=SEED, holdout_from=96, log=print, combo_hook=None):
    """Fit the point model, run validation and the cluster bootstrap. combo_hook(day_weights) is called
    once per bootstrap draw so the combo model shares the same resampled days."""
    t0 = time.time()
    bundle = DemandBundle(item_ids, kinds, price_ref, portion_ref, cost_ref)
    R = build_rows(sales, item_ids, price_ref, portion_ref)
    role = bundle.role
    n = bundle.n
    tau, tau_scores = select_tau(R, role, prior_b)
    val = holdout_validation(R, role, prior_b, holdout_from, tau)
    val["tau_cv_deviance"] = {str(k): round(v, 1) for k, v in tau_scores.items()}
    log(f"validation: direction hit {val['holdout_direction_hit_rate']:.3f}, tau_beta {tau}")
    ones = np.ones(len(R.y))
    w_test = (R.test == 1).astype(float)
    theta, L = fit_effects(R, w_test, role, tau, prior_b)
    alpha = reference_levels(theta, L, R, ones)
    theta[L.alpha] = alpha.ravel()
    bundle.point = dict(alpha=alpha, beta=theta[L.beta].copy(), pi=theta[L.pi].copy(), phi=theta[L.phi].copy())
    # naive version: manager-set rows only
    th_n, Ln = fit_effects(R, (R.test == 0).astype(float), role, tau, prior_b)
    bundle.naive_beta = th_n[Ln.beta].copy()
    # cluster bootstrap over days
    rng = np.random.default_rng(seed)
    n_days = int(R.day.max()) + 1
    n_blocks = (n_days + BLOCK_DAYS - 1) // BLOCK_DAYS
    A, B, P, F = [], [], [], []
    for b in range(n_boot):
        # days inside a test week share the same treatment, so whole weeks are resampled
        blocks = np.bincount(rng.choice(n_blocks, size=n_blocks, replace=True), minlength=n_blocks).astype(float)
        counts = blocks[np.arange(n_days) // BLOCK_DAYS]
        w_all = counts[R.day]
        th_b, Lb = fit_effects(R, w_all * w_test, role, tau, prior_b, theta0=theta.copy(), maxiter=150,
                               pt=prior_centres(n, prior_b, rng, tau))
        a_b = reference_levels(th_b, Lb, R, w_all)
        A.append(a_b); B.append(th_b[Lb.beta]); P.append(th_b[Lb.pi]); F.append(th_b[Lb.phi])
        if combo_hook is not None:
            combo_hook(counts)
    bundle.draws = dict(alpha=np.array(A), beta=np.array(B), pi=np.array(P), phi=np.array(F))
    bundle.meta = dict(validation=val, n_boot=n_boot, bootstrap_block_days=BLOCK_DAYS, seed=seed, tau_beta=tau, prior_beta=list(prior_b),
                       n_rows=int(len(R.y)), n_test_rows=int(w_test.sum()),
                       trained_through_day=int(R.day.max()), fit_seconds=round(time.time() - t0, 1),
                       dispersion_note="ranges come from the cluster bootstrap over days")
    log(f"demand model fitted in {time.time() - t0:.1f}s")
    return bundle
