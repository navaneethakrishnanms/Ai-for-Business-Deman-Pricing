"""Profile the Kaggle Retail Price Optimization data and save data/kaggle_findings.json.

Everything the service later claims about real data (elasticity range, pooling prior, direction
reliability, monotone-constraint effect) comes from this script. Run: python scripts/profile_kaggle.py
"""
import json
import sys
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import statsmodels.formula.api as smf
from sklearn.ensemble import HistGradientBoostingRegressor

warnings.filterwarnings("ignore")
ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "retail_price.csv"
OUT = ROOT / "data" / "kaggle_findings.json"


def load():
    df = pd.read_csv(RAW)
    df["date"] = pd.to_datetime(df["month_year"], format="%d-%m-%Y")
    df["ln_q"] = np.log(df["qty"])
    df["ln_p"] = np.log(df["unit_price"])
    df["t"] = (df["year"] - df["year"].min()) * 12 + df["month"]
    df["t"] = df["t"] - df["t"].min()
    for k in (1, 2, 3):
        df[f"rel_c{k}"] = np.log(df[f"comp_{k}"] / df["unit_price"])
    return df


def fe(formula, df, term="ln_p"):
    m = smf.ols(formula, df).fit(cov_type="cluster", cov_kwds={"groups": df["product_id"]})
    lo, hi = m.conf_int().loc[term]
    return dict(coef=float(m.params[term]), ci_low=float(lo), ci_high=float(hi), r2=float(m.rsquared), n=int(m.nobs))


def per_category(df):
    out = {}
    for cat, g in df.groupby("product_category_name"):
        if g["product_id"].nunique() > 1:
            f = "ln_q ~ ln_p + C(product_id)"
        else:
            f = "ln_q ~ ln_p"
        try:
            r = fe(f, g)
            r["includes_zero"] = bool(r["ci_low"] <= 0 <= r["ci_high"])
            r["n_products"] = int(g["product_id"].nunique())
            out[cat] = r
        except Exception as e:  # tiny categories
            out[cat] = dict(error=str(e))
    return out


def per_product(df):
    slopes = {}
    for pid, g in df.groupby("product_id"):
        if len(g) >= 12 and g["ln_p"].std() > 0.01:
            b = np.polyfit(g["ln_p"], g["ln_q"], 1)[0]
            slopes[pid] = float(b)
    return slopes


def wape(y, p):
    return float(np.abs(y - p).sum() / y.sum())


def backtest(df, cutoff):
    train, test = df[df["t"] < cutoff].copy(), df[df["t"] >= cutoff].copy()
    test = test[test["product_id"].isin(train["product_id"].unique())]
    res = {"cutoff_t": int(cutoff), "n_train": len(train), "n_test": len(test)}
    # product average baseline
    base = train.groupby("product_id")["qty"].mean()
    test["p_base"] = test["product_id"].map(base)
    res["wape_product_average"] = wape(test["qty"], test["p_base"])
    # pooled log-log with product fixed effects (no time trend)
    m = smf.ols("ln_q ~ ln_p + C(product_id)", train).fit()
    resid_var = m.mse_resid
    test["p_loglog"] = np.exp(m.predict(test) + resid_var / 2)
    res["wape_loglog_fe"] = wape(test["qty"], test["p_loglog"])
    res["loglog_price_effect"] = float(m.params["ln_p"])
    # with linear time trend (the thing we must not do)
    mt = smf.ols("ln_q ~ ln_p + t + C(product_id)", train).fit()
    test["p_trend"] = np.exp(mt.predict(test) + mt.mse_resid / 2)
    res["wape_loglog_with_time_trend"] = wape(test["qty"], test["p_trend"])
    # boosted models, free and price-monotone (-1 on ln price)
    feats = ["ln_p", "product_weight_g", "product_score", "holiday", "weekend", "month", "comp_1", "comp_2", "comp_3", "lag_price", "freight_price"]
    codes = {p: i for i, p in enumerate(sorted(df["product_id"].unique()))}
    train["pc"], test["pc"] = train["product_id"].map(codes), test["product_id"].map(codes)
    cols = ["pc"] + feats
    for name, cst in (("free", [0] + [0] * len(feats)), ("monotone", [0] + [-1] + [0] * (len(feats) - 1))):
        gb = HistGradientBoostingRegressor(loss="poisson", max_iter=150, learning_rate=0.06, max_depth=4,
                                           min_samples_leaf=8, monotonic_cst=cst, categorical_features=[0],
                                           random_state=7)
        gb.fit(train[cols], train["qty"])
        pred = gb.predict(test[cols])
        res[f"wape_boosted_{name}"] = wape(test["qty"], pred)
        up = test[cols].copy()
        up["ln_p"] = up["ln_p"] + np.log(1.10)
        res[f"boosted_{name}_demand_rises_after_10pct_price_rise"] = float((gb.predict(up) > pred * 1.0000001).mean())
    # direction out of sample: price deviation vs demand deviation (relative to product's training average)
    avg_p = train.groupby("product_id")["ln_p"].mean()
    avg_q = train.groupby("product_id")["ln_q"].mean()
    dp = test["ln_p"] - test["product_id"].map(avg_p)
    dq = test["ln_q"] - test["product_id"].map(avg_q)
    res["corr_price_dev_demand_dev"] = float(np.corrcoef(dp, dq)[0, 1])
    hi = dp > np.log(1.05)
    res["n_test_rows_price_above_5pct"] = int(hi.sum())
    res["share_demand_below_avg_when_price_above_5pct"] = float((dq[hi] < 0).mean()) if hi.any() else None
    return res


def main():
    if not RAW.exists():
        sys.exit(f"missing {RAW}")
    df = load()
    f = {"data": dict(rows=len(df), columns=df.shape[1], products=int(df["product_id"].nunique()),
                      categories=int(df["product_category_name"].nunique()),
                      first_month=str(df["date"].min().date()), last_month=str(df["date"].max().date()),
                      missing_values=int(df.isna().sum().sum()))}
    f["pooled_log_log_fe"] = fe("ln_q ~ ln_p + C(product_id)", df)
    f["with_calendar_controls"] = fe("ln_q ~ ln_p + holiday + weekend + C(month) + C(product_id)", df)
    f["with_calendar_and_competitor_price"] = fe(
        "ln_q ~ ln_p + holiday + weekend + C(month) + rel_c1 + rel_c2 + rel_c3 + C(product_id)", df)
    c = fe("ln_q ~ ln_p + np.log(customers) + C(product_id)", df)
    f["with_customers_outcome_proxy"] = c
    cats = per_category(df)
    f["per_category"] = cats
    ok = [v for v in cats.values() if "coef" in v]
    f["per_category_summary"] = dict(min=min(v["coef"] for v in ok), max=max(v["coef"] for v in ok),
                                     intervals_including_zero=sum(v["includes_zero"] for v in ok), n=len(ok))
    prods = per_product(df)
    vals = np.array(list(prods.values()))
    f["per_product_summary"] = dict(usable=len(vals), negative=int((vals < 0).sum()), median=float(np.median(vals)))
    f["backtests"] = [backtest(df, k) for k in (12, 14, 16)]
    f["notes"] = ["customers is an outcome proxy and is excluded from every model",
                  "no linear time trend is used (see wape_loglog_with_time_trend)"]
    p = f["pooled_log_log_fe"]
    f["demand_model_prior"] = dict(mean=round(p["coef"], 2), sd=round((p["ci_high"] - p["ci_low"]) / (2 * 1.96), 2),
                                   ci=[round(p["ci_low"], 2), round(p["ci_high"], 2)])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(f, indent=2))
    print(json.dumps({k: f[k] for k in ("pooled_log_log_fe", "with_calendar_controls", "with_calendar_and_competitor_price",
                                          "with_customers_outcome_proxy", "per_category_summary", "per_product_summary",
                                          "demand_model_prior")}, indent=2))
    for b in f["backtests"]:
        print({k: (round(v, 3) if isinstance(v, float) else v) for k, v in b.items()})


if __name__ == "__main__":
    main()
