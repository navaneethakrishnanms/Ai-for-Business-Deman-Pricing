You are building the AI service for CampusPrice (TCS Technology Day 2026 hackathon, PS 2.4: AI-Powered Pricing and Combo Offer Decision Support). FIRST: save this whole message verbatim to ai_service/BUILD_PROMPT.md so it survives context resets, and re-read it whenever unsure.

0. SCOPE AND RULES
- Work only inside ai_service/. Docs/ is read-only reference. Never edit backend/, frontend/, Docs/ or the root README.md. Teammates build the backend (database, login) and the frontend; my part is this AI service, which they connect to over HTTP on a port.
- Extend the existing skeleton (app/main.py, app/api/, requirements.txt, .env.example, data/.gitkeep); keep what works.
- Read first: the PDF "CampusPrice API Contract and Data Flow" in Docs/ (source of truth for endpoint names, fields, types), the PS 2.4 PDF, and an SRS PDF if present. If a PDF is unreadable, say so and use section 5.
- Do not stop to ask questions. Decide, record the decision in ai_service/DECISIONS.md, continue. Only stop if ai_service/data/raw/retail_price.csv is missing; then tell me and build everything that does not need it.
- Never invent results. Every number you report or put in docs must come from running code. If a test fails, say so.
- Windows-friendly: pathlib, no bash-only scripts, README commands for PowerShell and bash. No secrets in the repo; .env is git-ignored.

1. WHAT IT MUST ACHIEVE
- Students (customers) have tight budgets and want fair, affordable, clear-value offers. The manager (owner) wants profit and no losing items. PS asks for: (a) predict how demand changes with price and portion size, (b) compare price and combo scenarios on sales and margin, (c) recommend prices and combos that suit student budgets.
- Principle: profit-safe by construction. The owner sets guardrails, the optimiser works only inside them, students see only offers that already pass the profit checks.
- AI only where rules cannot do the job. Rules (no ML): menu-health flags, break-even maths, student budget filter. ML: demand response. LLM: only parses a typed what-if and explains numbers already computed; it never produces a number. The service must work with no LLM and no internet.
- Innovations to build (cut only the Could items last): profit-vs-affordability frontier ("price of affordability"); Apply/Pilot/Hold gate with a one-week pilot plan; cannibalisation-aware combo engine; portion ladder with Rs per 100 g (no silent shrinking); hidden-world grading of recommendations; real-data check on the Kaggle file; override log kept for the next cycle.

2. THE CORE MODEL (build with the most care)
Job: for item i, price, portion_size_g, discount_pct, day_type -> expected units per day, hence revenue and profit, each as {mean, p10, p90}.
- Form: units = ref_units[i,d] * (net_price/ref_price[i])^beta_i * (portion/ref_portion[i])^pi_i, with net_price = price*(1 - discount_pct/100). beta_i is the price effect (always negative), pi_i the portion effect (>= 0).
- Fit: Poisson or negative-binomial count model, log link, on item-day rows, with day-type effects.
- Partial pooling: beta_i = beta_category + delta_i with a ridge penalty on delta_i, so thin items borrow from their category. Prior mean for beta_category = pooled Kaggle estimate (about -2.4, sd about 0.4 from its CI of -3.2 to -1.6). Same idea for pi_i.
- Constraint: beta_i <= -0.05 as a hard bound (bounded optimiser or penalised likelihood), so a price rise never predicts more demand.
- Identification: days 1-60 have manager-set prices biased by an unobserved crowd shock; days 61-120 are randomised tests. Estimate beta and pi from price_test=1 rows; use all rows for ref_units. Also fit a naive version on manager-set rows and report the gap in /model/status (it shows why randomised testing matters).
- Ranges: cluster bootstrap over days (200 draws, fixed seed), refit per draw, keep draws in memory. Compare scenario vs Today with paired draws, so risk_prob_below_today and prob_improves are paired probabilities.
- profit = units * (net_price - unit_cost(portion)); unit_cost = base_cost * (portion/ref_portion)^0.8.
- Challenger (Could): gradient boosting with a price-decreasing monotone constraint, only to cross-check; report disagreement; never serve its numbers.
- Honesty: claim direction and range of the price response, not exact unit forecasts. Kaggle backtests showed unit WAPE 74-98% with no model beating the product average.

3. DATA
3a. ORIGINAL DATA: Kaggle "Retail Price Optimization" (suddharshan) at ai_service/data/raw/retail_price.csv (676 rows, 30 columns, 52 products, 9 categories, Jan 2017-Aug 2018, month_year as dd-mm-yyyy). Write scripts/profile_kaggle.py (statsmodels, product fixed effects, clustered SEs) and save results to data/kaggle_findings.json. Expected checkpoints:
- pooled log-log price effect about -2.4 (95% CI about -3.2 to -1.6); about -2.42 with holiday/weekend/month controls; about -2.50 adding relative competitor price (comp_1..3)
- per category from about -7.1 to +0.5, 7 of 9 intervals include zero (why we pool); per product 29 of 40 usable slopes negative, median about -2.1
- "customers" is an outcome proxy (adding it moves the effect to about -1.18): exclude it
- three time-ordered backtests: unit WAPE 74-98% for all models; price-deviation vs demand-deviation correlation about -0.42, -0.32, -0.38; a free boosted model predicts demand rising after a +10% price rise in 38% of test rows, a price-monotone one in 0%
- no linear time trend (it extrapolated badly)
If your numbers differ, investigate and report; do not force them. Uses: the generator draws true elasticities from the measured range; the demand model prior; /model/status real_data_check; tests.

3b. SYNTHETIC DATA: seeded generator (scripts/generate_data.py plus app/synth/). Fields: the 9 PS fields (item, price, portion_size_g, cost, qty_sold, combo yes/no, combo_items, day_type, discount_pct) plus date and price_test.
- Menu (starting values, tune freely): mains Veg Meals 70/45/350g, Egg Fried Rice 60/36/300g, Chicken Biryani 90/96/350g, Dosa 40/24/180g, Chapati Kurma 50/30/250g, Paneer Roll 55/57/200g, Salad Bowl 65/38/200g (price/cost/portion). Add-ons Tea 12/4/150g, Cold Coffee 40/17/250g, Samosa 15/7/80g, Fresh Juice 45/30/250g. Combos: Veg Meals+Tea, Dosa+Cold Coffee, Chicken Biryani+Fresh Juice. Portion tiers small/regular/large per item.
- 120 days; day types regular/exam/weekend/event with footfall about 700/520/230/860. Three student tiers (tight, mid, flexible) with budgets about Rs 60/100/170 (lognormal) and price sensitivity highest for tight. Tier shares by day type: regular .40/.40/.20, exam .50/.38/.12, weekend .30/.40/.30, event .35/.40/.25. Keep these in config/tier_params.yaml so student-survey numbers (Van Westendorp style, 30-50 responses) replace them without code changes.
- Each student picks a main (or nothing) by multinomial logit under a budget constraint, then an add-on (or none). A combo discount applies to the specific pair, so cannibalisation emerges naturally.
- Daily unobserved crowd shock (never written to the log). Days 1-60: manager-set prices that follow the crowd. Days 61-120: random weekly tests, item price x {0.85,0.90,0.95,1,1.05,1.10,1.15}, a random subset of item-weeks also changes portion tier (so the portion effect is identifiable), and combo discounts random weekly from {0,5,10,15}%. price_test=1 on randomised rows.
- Calibrate: each item's true elasticity (finite difference on noise-free expected demand) must fall in -1.6 to -3.2; print a table.
- Planted cases (assert in tests): Chicken Biryani popular loss-maker (about 70/day); Paneer Roll mild loss-maker; Salad Bowl and Fresh Juice poor sellers (about 10/day each); Dosa underpriced star with high volume; Veg Meals+Tea a combo that works; Dosa+Cold Coffee a cannibalisation trap; Chicken Biryani+Fresh Juice a bad combo (bundles a loss-maker).
- Outputs: data/synthetic/sales_log.csv (about 1,320 item-day rows plus about 360 combo-day rows), items.csv, student_tiers.csv. Hidden truth goes to ai_service/grader_data/hidden_truth.json; nothing under app/ may import it.
- Label data_source as synthetic in every response meta.

4. ENGINE PARTS
- Menu health (rules): loss_maker (cost > price), poor_seller, star; margin_abs, margin_pct, units_per_day.
- Combo engine: take_rate (range) vs discount (fit on the random weekly discounts), baseline attach, add_on_lift, main_traffic_lift, cannibalised_share, break_even_take_rate, incremental_profit_per_day (range), prob_profit_improves. Unit test: main Rs 70 (cost 45), drink Rs 20 (cost 5), baseline attach 30%, combo Rs 82 gives 29.5 per meal buyer at baseline, 32 per combo, 25 meal-only, so break_even_take_rate = (29.5-25)/(32-25) = 0.643. Never recommend a combo containing an item sold below cost.
- Student layer: tier budgets from tier_params; complete meal = one main + one add-on within budget; coverage overall and per tier; price_per_100g.
- Optimiser: coordinate search, up to 10 passes, over item price within +/-15% (and the weekly cap), portion tiers, combo discounts 0/5/10/15%; maximise expected daily profit over day_type_mix subject to guardrails and coverage_target. For an item already below the margin floor the rule is "move toward it": improve margin within the weekly cap and flag the remaining gap. Sweep coverage_target to produce frontier[]. With fairness_mode true: one price for all day types and block any increase that pushes tight-tier exam-day coverage below the target.
- Guardrail defaults (owner-editable via /config, tune so planted cases are solvable): margin_floor_pct 15, max_weekly_change_pct 10, student_price_cap 120, coverage_target 0.80, combo_discount_cap_pct 15, fairness_mode true.
- Gate: Apply if P(improve) >= 0.8; Pilot if P >= PILOT_MIN_PROB (env, default 0.6) with pilot_plan {duration_days 7, arms}; else Hold. Each recommendation has a plain reason and guardrails_met[]. Return at most 8, one per item or combo.
- Overrides: persist approve/edit/reject with note in SQLite (data/ai_service.db). Approve/edit updates the service's menu state; approved combos/offers feed /student/offers. Seed approved offers from Apply-status results at first start so the student screen is not empty. Add POST /demo/reset (owner) to restore the seed state.

5. API (follow the PDF contract exactly; compact summary)
Envelope: {data, meta{model_version, data_source, generated_at, request_id}}. Errors: {error{code, message, field}} with 400/401/404/422/429/503. Types: money float 2dp, predicted units float, portion int, discount_pct and margin_pct float 0-100, shares/probabilities/coverage/take rates float 0-1, elasticity negative, range {mean,p10,p90}, day_type regular|exam|weekend|event.
- GET /items -> items[] (item_id, name, kind, price, cost, portion_size_g, units_per_day, margin_abs, margin_pct, flags[], portion_tiers[]) + combos[]
- GET/PUT /config -> the six guardrails
- POST /predict {item_id, price, portion_size_g, discount_pct, day_type} -> units, revenue, profit (ranges), margin_pct, price_effect (range), baseline, curve[], flags[]
- POST /scenarios/compare {scenarios[], day_type_mix?} -> results[] (Today first): units, revenue, profit, margin_pct, coverage{overall,tight,mid,flexible}, price_per_100g, risk_prob_below_today, delta_vs_today, flags[]
- POST /combos/evaluate and GET /combos/suggestions (fields in section 4)
- POST /recommend {coverage_target?, day_type_mix?, include_frontier} -> recommendations[], summary, frontier[]
- POST /overrides, GET /overrides
- GET /student/offers?budget= (no auth, read-only, rate-limited) -> up to 3 offers: offer_id, title, items[], price, list_price, you_save, price_per_100g, badge. Use a separate response model so cost, margin, ranges and model details can never leak.
- POST /assistant/query {text, context?} -> parsed_request, result, explanation, numbers_used[], fallback
- GET /model/status -> model_version, trained_through, data_source, validation{metric, value}. Use metric "holdout_direction_hit_rate". Additive optional fields allowed (naive_vs_randomised gap, real_data_check, scorecard); never rename or remove contract fields.
- Extra: GET /health, POST /demo/reset.

6. ASSISTANT (optional, last)
app/llm/: provider and key from .env (LLM_API_KEY, LLM_MODEL); never hardcode. The LLM only turns text into a parsed_request for an existing endpoint and writes the explanation from computed numbers; numbers_used[] lists the result paths it cites. With no key, no internet or any failure: a rule-based parser (raise/cut a price by N%, combo at N% off, compare) plus template explanations, fallback=true. No screen may depend on the LLM.

7. RUNNING AS A SERVICE
- FastAPI + Uvicorn: uvicorn app.main:app --host 0.0.0.0 --port 8001 (PORT env; if .env.example already defines a port keep it and tell me). Models load once at startup.
- First start auto-bootstraps if artifacts are missing: generate data, train, seed SQLite, log progress. Also scripts/bootstrap.py. Artifacts in artifacts/ with a model_version.
- Auth: Authorization Bearer OWNER_TOKEN from .env (static demo token; AUTH_DISABLED=true for local dev). Teammates can swap in real login later or call this service from their backend.
- CORS_ORIGINS env (comma list, default http://localhost:5173 and http://localhost:3000). Request-id middleware. In-memory rate limit on the student endpoint (429).
- Performance targets (proposed): predict, compare, combo evaluate <= 2 s; recommend <= 5 s on a laptop. Precompute and cache draws.
- Pydantic v2 models for every request and response; export ai_service/openapi.json via scripts/export_openapi.py. Pin requirements.txt to versions that actually installed.

8. TESTS (pytest) and scripts/verify.py
Cover: contract shapes and envelope; p10 <= mean <= p90; +10% price never raises predicted units for any item; planted cases; guardrails block or flag every violation (margin floor, weekly cap, coverage target, discount cap, fairness mode); student endpoint exposes no cost, margin, range or model field; true elasticity inside the model's p10-p90 for most items (report the count out of 11); gate calibration in the hidden world (share of Apply recommendations that truly raise profit, expected >= 80%); offline run with no LLM key; break-even unit test. scripts/verify.py prints a one-page scorecard of real measured numbers, saves it to data/scorecard.json, and feeds /model/status.

9. DOCS FOR MY TEAMMATES
ai_service/README.md (install, bootstrap, run on Windows and bash, env vars, port, test command) and ai_service/docs/INTEGRATION.md: base URL and port, auth, CORS, endpoint table, error shape, an optional pattern for the backend to proxy, and request/response examples captured from the running service (no hand-written numbers). Add requests.http with one call per endpoint.

10. ORDER OF WORK
M1 read Docs and skeleton, plan briefly. M2 profile_kaggle.py. M3 generator plus calibration table. M4 demand model plus validation and tests. M5 combo, student layer, optimiser, gate. M6 all endpoints plus SQLite plus auth, CORS, rate limit. M7 docs, openapi.json, verify.py, full test run. M8 assistant and challenger (Could). Run tests after each milestone.
DONE WHEN: pip install -r requirements.txt, python scripts/bootstrap.py, uvicorn on the port, pytest all green, every endpoint answered by curl, openapi.json matches the contract. Final report: what was built, the real measured numbers, deviations from the contract or SRS, and open items.
