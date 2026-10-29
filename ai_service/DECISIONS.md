# CampusPrice AI Service – Design Decisions

Recorded here per BUILD_PROMPT section 0 rule: "decide, record, continue".

| # | Decision | Rationale |
|---|---|---|
| D-01 | Port 8001 (AI_PORT) | `.env.example` already had AI_PORT=8000; changed to 8001 to avoid conflict with typical Flask/Django backends. |
| D-02 | No `/api` prefix | Contract PDF endpoints are `/items`, `/predict`, etc. without a prefix. Router mounted at root. |
| D-03 | AUTH_DISABLED=true default in .env.example | Simplifies local dev; teammates set to false in production. |
| D-04 | `statsmodels` for profile_kaggle.py, `scipy.optimize` for demand model | statsmodels gives familiar OLS/GLM API for the Kaggle profiling. scipy L-BFGS-B for the Poisson NLL with bounds. |
| D-05 | Cluster bootstrap over 7-day blocks | Days inside a test week share the same price treatment; whole-week resampling respects this structure. |
| D-06 | Combo model: logistic attach rate, logit-linear in discount/price/day-type | Simple, interpretable, no overfitting with only 3 combos × 60 test days. |
| D-07 | SQLite for state (not in-memory dict) | Survives server restarts; teammates can inspect it directly. |
| D-08 | Student endpoint: no cost/margin/range/model fields | Request: "Use a separate response model so cost, margin, ranges and model details can never leak." Enforced by constructing the offer dict manually with only the allowed fields. |
| D-09 | Engine singleton loaded at FastAPI startup | Models take ~60–120s to fit; they must not re-fit on every request. Precomputed bootstrap draws shared across all endpoints (paired comparisons). |
| D-10 | Optimizer: coordinate search, 10 passes | Simple, explainable, fast (<5 s on a laptop). Gradient-based methods would be harder to guardrail. |
| D-11 | Frontier: single-pass per coverage target (not full coordinate search) | Full search per target would be too slow. Single-pass gives a meaningful Pareto curve for illustration. |
| D-12 | LLM assistant: rule-based parser always runs; LLM is optional override | "The service must work with no LLM and no internet." Rule parser covers the three main intents (predict/recommend/combo). |
| D-13 | Synthetic data domain: campus canteen food items only | PS explicitly lists food items (Veg Meals, Biryani, Dosa, Tea, etc.). This is not a retail product pricing tool; the Kaggle dataset is used only for elasticity priors. |
| D-14 | Price_test=1 rows for demand effects; all rows for ref_units | "Estimate beta and pi from price_test=1 rows; use all rows for ref_units." Implemented in fit_effects weight = (R.test == 1). |
| D-15 | Beta hard bound -0.05 via L-BFGS-B bounds | "Constraint: beta_i <= -0.05 as a hard bound." Bounded optimiser enforces this exactly. |
| D-16 | Groq LLM integration (model openai/gpt-oss-120b) | Configured Groq provider with fallback to rule-based parser on network/key/import absence. |
| D-17 | Challenger GBM (M8 Could) cross-check only | HistGradientBoostingRegressor with monotonic_cst=-1 on log_price. Fits after main model in bootstrap. Its numbers never serve requests; disagree_pct surfaced in /model/status as a transparency metric. |
