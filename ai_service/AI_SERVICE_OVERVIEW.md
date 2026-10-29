# CampusPrice AI Service – Architecture, Status and Audit

PS 2.4 – AI-Powered Pricing and Combo Offer Decision Support (TCS Technology Day 2026)
Audit date: 2026-10-29. Every number below was read from artifacts in this repo or produced by running the code during the audit.

---

## 1. Verdict

| Area | Status |
|---|---|
| Service runs (FastAPI, port 8001, loads in seconds from cached artifacts) | Working |
| Demand model trained and saved | Trained (synthetic data only) |
| Combo model, student layer, menu-health rules | Working |
| 15 endpoints answer with the contract envelope | Working |
| pytest | 25 passed, 1 skipped (the skipped one is the gate-precision test) |
| `/recommend` (optimiser + Apply/Pilot/Hold gate) | **Not correct. Do not demo or connect yet** (see section 8) |
| Student offers safety ("only profit-checked offers") | **Not guaranteed** (see section 8) |
| LLM assistant | Rule-based path works; Groq path not exercised in this audit |

**Short answer:** the prediction and what-if parts (`/items`, `/predict`, `/scenarios/compare`, `/combos/evaluate`, `/model/status`) are ready for the team to connect. The recommendation part has two real bugs that produce unsafe output and must be fixed first. Nothing was changed in the code during this audit.

---

## 2. What is built (architecture)

```
                 data/raw/retail_price.csv (Kaggle, 676 rows)
                          │ scripts/profile_kaggle.py
                          ▼
                 data/kaggle_findings.json ──► prior for price effect (-2.44, sd 0.41)
                                                        │
 config/tier_params.yaml ─► app/synth (world.py, generate.py) ─► data/synthetic/{sales_log,items,student_tiers}.csv
 (student tiers, budgets)        │                             grader_data/hidden_truth.json (never read by app/)
                                 ▼
        app/models/demand.py   Poisson log-linear, partial pooling, bounded beta, 200 cluster-bootstrap refits
        app/models/combo.py    logistic take-rate vs discount (same bootstrap weeks → paired draws)
        app/models/student.py  rules: budget tiers, coverage, Rs/100 g, portion ladder
        app/engine/engine.py   evaluates any menu across all 200 draws → mean/p10/p90, flags, combos, health rules
        app/engine/optimizer.py coordinate search + frontier
        app/engine/gate.py     Apply / Pilot / Hold + 7-day pilot plan
        app/engine/challenger.py  monotone gradient-boosting cross-check (never served)
        app/llm/assistant.py   rule parser (+ optional Groq/Gemini/OpenAI) → calls the engine
        app/storage.py         SQLite data/ai_service.db (menu state, guardrails, offers, recommendations, overrides)
        app/api/endpoints.py   FastAPI routes, envelope, auth, rate limit
        app/main.py            CORS, request-id, startup (state.py loads artifacts or refits)
```

Design rule: **AI only where rules cannot do the job.**
- Rules (no ML): menu-health flags, break-even take rate, student budget filter, guardrails.
- ML: demand response to price / portion / combo discount.
- LLM (optional): turns typed text into a request and explains numbers already computed. It never produces a number. The service works with no LLM and no internet.

---

## 3. The models

### 3.1 Demand model (`app/models/demand.py`) – trained
`units = ref_units[item, day_type] × (net_price/ref_price)^β × (portion/ref_portion)^π × exp(φ · combo_discount/10)`

- Poisson count model, log link, fitted with L-BFGS-B on item-day rows.
- **Partial pooling:** β of each item is pulled toward its category (main / add-on), and the category toward the Kaggle prior (-2.44, sd 0.41). Same for the portion effect π.
- **Hard bound** β ≤ -0.05, so a price rise can never predict more demand.
- **Identification:** β, π, φ use only the randomised test weeks (days 60–119, `price_test=1`); `ref_units` uses all rows. A naive fit on manager-set rows is kept to show why randomised testing matters.
- Pooling strength τ chosen by rolling-origin deviance: τ = 0.3.
- **Ranges:** 200 cluster-bootstrap refits over 7-day blocks (seed 2026), kept in memory; scenario-vs-Today comparisons use the same draws (paired probabilities).
- Profit = units × (net price − unit cost), unit cost = base cost × (portion/ref)^0.8.
- Trained on 1,320 item-day rows (660 randomised), through day 119. Fit time 5.3 s.
- Artifacts: `artifacts/demand_model.json`, `artifacts/demand_model.npz`.

### 3.2 Combo model (`app/models/combo.py`)
Logistic attach/take rate in discount, add-on price and day type, one fit per (main, add-on) pair with combo history, refitted on the same bootstrap weeks. Pairs without history use a pooled estimate flagged `data_confidence: "pooled"` and are capped at Pilot. Outputs: take rate range, add-on lift, main-traffic lift, cannibalised share, break-even take rate, incremental profit range, P(profit improves). Break-even closed-form check reproduces the spec example: **0.6429**.

### 3.3 Student layer (`app/models/student.py`) – rules
Three tiers (tight / mid / flexible) with lognormal budgets (median Rs 60 / 100 / 170, sigma 0.30). "Complete meal" = cheapest main + add-on pair. Coverage = share of students whose budget covers it, overall and per tier. Parameters live in `config/tier_params.yaml` (marked as placeholders pending a student survey).

### 3.4 Optimiser and gate
Coordinate search, up to 10 passes, over price (±15% grid), portion tier, combo discount (0/5/10/15%), subject to margin floor, weekly cap, student price cap, coverage target, combo cap, fairness mode. Gate: **Apply** if P(improve) ≥ 0.80, **Pilot** if ≥ 0.60 (env `PILOT_MIN_PROB`), else **Hold**; pilot recommendations carry a 7-day plan.

### 3.5 Challenger (`app/engine/challenger.py`)
HistGradientBoosting with a price-decreasing monotone constraint, 660 rows, train RMSE 14.53. Cross-check only; never serves a number.

### 3.6 LLM assistant (`app/llm/assistant.py`)
Rule parser first (raise/cut price, combo at N% off, compare, recommend). If `LLM_API_KEY` is set, Groq (`openai/gpt-oss-120b`), Gemini or OpenAI can override the parse. Any failure falls back to rules with `fallback: true`.

---

## 4. Data

| Data | What it is | Where |
|---|---|---|
| Real data | Kaggle "Retail Price Optimization", 676 rows, 52 products, 9 categories. Used only for the elasticity prior and a real-data sanity check, not for the canteen. | `data/raw/retail_price.csv`, `data/kaggle_findings.json` |
| Synthetic canteen | 11 items (7 mains, 4 add-ons), 3 combos, 120 days, 4 day types, 3 student tiers. Days 1–60 manager-set prices biased by a hidden crowd shock; days 61–120 randomised price/portion/discount tests. | `data/synthetic/*.csv` |
| Hidden truth | True elasticities and profit function for grading only. `app/` serving code does not import it (only `app/synth` does). | `grader_data/hidden_truth.json` |

**Everything the service reports is `data_source: "synthetic"`.** The model has never seen real canteen sales. Real data must replace `sales_log.csv` before the numbers mean anything for a real shop.

Planted cases all check out: Chicken Biryani loss-maker (~83 units/day, margin -6.7%), Paneer Roll loss-maker (-3.6%), Dosa and Veg Meals stars, Salad Bowl and Fresh Juice poor sellers (~10–13/day).

---

## 5. Measured quality (from `data/scorecard.json` and the audit run)

| Metric | Value | Reading |
|---|---|---|
| Holdout direction hit rate (days 96+) | 0.781 (naive model 0.776) | Good, but barely better than naive |
| Holdout unit WAPE | 0.192 (item-average baseline 0.425) | Clearly better than the baseline, on synthetic data |
| True elasticity inside model p10–p90 | **7 of 11 items** | Misses: Chicken Biryani, Chapati Kurma, Salad Bowl, Tea |
| +10% price raises units? | 0 violations | Constraint works |
| Bootstrap draws / seed | 200 / 2026 | |
| Naive-vs-randomised β gap (mean) | +2.36 | Manager-set prices give a badly biased elasticity |
| Kaggle pooled price effect | -2.44 (95% CI -3.23 to -1.64) | Matches expected |
| Kaggle backtest unit WAPE (product-average baseline) | 0.77 – 0.94 | Honest: no model beats the average on real data |
| Response time `/recommend` with frontier | 0.55 s | Within target |

Kaggle numbers that differ from the build brief's checkpoints and were **not investigated or recorded in DECISIONS.md**: effect with calendar controls -2.58 (brief: about -2.42); with competitor price -2.61 (brief: about -2.50); category intervals including zero 5 of 9 (brief: 7 of 9); products with negative slope 23 of 31 (brief: 29 of 40).

---

## 6. API (port 8001, no `/api` prefix, envelope `{data, meta}`)

`GET /health`, `GET /items`, `GET|PUT /config`, `POST /predict`, `POST /scenarios/compare`, `POST /combos/evaluate`, `GET /combos/suggestions`, `POST /recommend`, `POST|GET /overrides`, `GET /student/offers?budget=` (no auth, rate-limited 60/min), `POST /assistant/query`, `GET /model/status`, `POST /demo/reset`. Full details: `docs/INTEGRATION.md`, `openapi.json`, `requests.http`, live docs at `/docs`.

Run (this machine has Python only through Anaconda, not on PATH):
```powershell
cd ai_service
C:\Users\nk\anaconda3\python.exe scripts\bootstrap.py     # only if artifacts are missing
C:\Users\nk\anaconda3\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8001
C:\Users\nk\anaconda3\python.exe -m pytest tests -q
```

---

## 7. What works (verified by running it)

- `/health`, `/items` (flags, margins, portion tiers), `/predict` (units/revenue/profit with p10–p90, price effect, curve, guardrail flags), `/scenarios/compare` (Today first, coverage by tier, paired risk), `/combos/evaluate` and `/combos/suggestions`, `/model/status` (validation, naive gap, real-data check, scorecard, challenger).
- Combo engine behaves as intended: Biryani + Juice is Hold (loss-maker), Dosa + Cold Coffee is Hold (78% cannibalised, P(improve) 0.15), Veg Meals + Tea at 5% is Pilot.
- Error shape for unknown item: `{error:{code,message,field}}` with 404.
- Offline assistant parses "raise dosa price by 10%" and "combo of dosa and cold coffee at 10% off".

---

## 8. Problems found (fix before the team connects `/recommend` and student offers)

**P1 – `/recommend` returns nothing at default guardrails.** Coverage today is 0.669, below the 0.80 target, and the optimiser requires every candidate (including "no change") to meet the target, so nothing is feasible. The loss-makers (Biryani, Paneer Roll) also can't be fixed: the margin floor rejects every price within the weekly cap, and the specified "move toward the floor and flag the gap" rule is not implemented.

**P2 – Weekly-cap guardrail is violated and then reported as met.** The coordinate loop re-uses its own previous result as the baseline each pass, so the cap compounds: tea Rs 12 → Rs 7 (-42%), samosa Rs 15 → Rs 11.5, cold coffee Rs 40 → Rs 29.5. The response itself contains `flags: ["change_too_large"]` while `guardrails_met` lists `weekly_cap` (the names never match the flag names, so `guardrails_met` is always full).

**P3 – Those recommendations lose money in the hidden world.** With coverage target lowered to 0.5, the service says tea and samosa are **Apply** (P 0.87 / 0.94) and cold coffee **Pilot**. The hidden-world true profit change is **-442, -154 and -609 Rs/day** against the model's +189, +39 and +218. The Apply gate is not calibrated; the required ≥80% hidden-world precision was never actually measured (see P4).

**P4 – The scorecard's gate precision is not a real test.** `scripts/verify.py` and the pytest check count a recommendation as "good" if the model's own mean is positive (circular, never uses hidden truth). With 0 Apply recs the scorecard shows `apply_gate_precision: 0.0`, and the pytest case is skipped.

**P5 – Student offer shown today comes from a test, not from the profit gate.** `data/ai_service.db` holds `combo_veg_tea, 10%, source "test"`, written by a pytest case that uses the real database. `/student/offers` therefore shows Veg Meals + Tea at Rs 73.8, though `/combos/evaluate` says that 10% combo is Hold (P(improve) 0.42, -Rs 27/day). `/student/offers` does not re-check the gate, and the seeding step (only Apply combos) produced no offers on its own. `POST /demo/reset` restores a clean state, but tests will dirty it again.

**P6 – Error shape does not match the contract for 422/401/429.** FastAPI wraps them as `{"detail":{"error":{...}}}` instead of `{"error":{...}}`. Auth was never tested because `.env` has `AUTH_DISABLED=true`.

**P7 – Profit-vs-affordability frontier is degenerate.** Coverage actual stays at 0.669–0.697 for all targets and profit is flat (8554.5) from target 0.72 up; it is a single pass from Today, not a real frontier.

**P8 – Assistant parser bug.** "cut veg meals to Rs 65" parses as item "veg meals to Rs", change 65% (a 65% cut). The `compare` intent returns no result, and the explanation always says "raise" or "lower" generically. The Groq path (key is present in `.env`) was not called in this audit.

**P9 – Docs contain invented numbers.** The `/predict` example in `docs/INTEGRATION.md` (105.2 units, baseline 121) does not match the running service (117.6 units, baseline 151.7). The brief required captured outputs only.

**P10 – Smaller items**
- Elasticity coverage 7/11 (brief wanted most; the unit test only requires 40%).
- Several tests are weak: the fairness test asserts only that `flags` exists; the student-privacy test checks raw DB rows, not the endpoint response; the combo tests assert almost nothing.
- `requirements.txt` uses `>=`, not pinned versions.
- `ai_service/` is untracked in git (nothing committed).
- `.env` holds an LLM key; it is git-ignored, but confirm `.gitignore` before any push.

---

## 9. Suggested order to finish

1. Fix the optimiser: keep the cap relative to Today's price, make "no change" always feasible, implement "move toward the margin floor", and derive `guardrails_met` from real checks. (P1, P2)
2. Add a real hidden-world grader to `verify.py` and a non-skipped pytest (compare each recommendation's true profit change against the model's). Recalibrate the gate if Apply precision is under 80%. (P3, P4)
3. Make tests use a temporary database; make `/student/offers` serve only offers that currently pass the combo gate. (P5)
4. Return the contract error shape for all errors; test with `AUTH_DISABLED=false`. (P6)
5. Rebuild the frontier with a coordinate search per target. (P7)
6. Fix the assistant price parsing; call Groq once to confirm it works. (P8)
7. Regenerate `docs/INTEGRATION.md` examples from the running service, pin requirements, commit. (P9, P10)

Until step 1–3 are done, the team can safely connect `/items`, `/predict`, `/scenarios/compare`, `/combos/evaluate`, `/combos/suggestions`, `/model/status` and `/config`; keep `/recommend` and `/student/offers` out of the demo.
