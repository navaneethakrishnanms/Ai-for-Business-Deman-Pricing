# CampusPrice AI Service

**PS 2.4 – AI-Powered Pricing and Combo Offer Decision Support**  
TCS Technology Day 2026 Hackathon

---

## What is this?

A self-contained FastAPI micro-service that:
- **Predicts demand** (units, revenue, profit with p10–p90 ranges) for any price/portion/discount/day-type combination
- **Evaluates combos** with cannibalisation detection and break-even take-rate
- **Recommends** price changes with Apply / Pilot / Hold gates and one-week pilot plans
- **Shows student-friendly offers** filtered by budget (no cost/margin leaks)
- **Answers natural-language what-ifs** via a rule-based assistant (optional LLM)

All numbers are from running code, all ML is on a campus food dataset (11 items, 120 simulated days).

---

## Food items in scope

| ID | Name | Kind | Price (Rs) |
|---|---|---|---|
| veg_meals | Veg Meals | main | 70 |
| egg_fried_rice | Egg Fried Rice | main | 60 |
| chicken_biryani | Chicken Biryani | main | 90 |
| dosa | Dosa | main | 40 |
| chapati_kurma | Chapati Kurma | main | 50 |
| paneer_roll | Paneer Roll | main | 55 |
| salad_bowl | Salad Bowl | main | 65 |
| tea | Tea | addon | 12 |
| cold_coffee | Cold Coffee | addon | 40 |
| samosa | Samosa | addon | 15 |
| fresh_juice | Fresh Juice | addon | 45 |

Combos: Veg Meals+Tea, Dosa+Cold Coffee, Chicken Biryani+Fresh Juice.

---

## Install

```powershell
# PowerShell
cd ai_service
python -m venv .venv
.venv\Scripts\Activate
pip install -r requirements.txt
```

```bash
# bash
cd ai_service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

## Environment

```powershell
Copy-Item .env.example .env
```

Open `.env` and set at minimum:
```
AUTH_DISABLED=true   # skip token for local dev
AI_PORT=8001
```

---

## Bootstrap (first run)

```powershell
python scripts/bootstrap.py
```

This will:
1. Generate 120-day synthetic campus sales data  
2. Fit the demand model (200 bootstrap draws, ~60–120 s on a laptop)  
3. Seed the SQLite database with menu state and student offers  
4. Write a scorecard to `data/scorecard.json`

Use `--force` to regenerate everything:
```powershell
python scripts/bootstrap.py --force
```

---

## Run

```powershell
# PowerShell
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

```bash
# bash
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

Interactive docs: http://localhost:8001/docs  
Health check: http://localhost:8001/health

---

## Tests

```powershell
cd ai_service
python -m pytest tests/ -v
```

---

## Verify (scorecard)

```powershell
python scripts/verify.py
```

Prints a one-page report of real measured numbers and saves `data/scorecard.json`.

---

## Export OpenAPI

```powershell
python scripts/export_openapi.py
```

Writes `openapi.json` to `ai_service/`.

---

## Environment variables (full list)

| Variable | Default | Description |
|---|---|---|
| `AI_PORT` | `8001` | Server port |
| `AI_HOST` | `0.0.0.0` | Bind host |
| `OWNER_TOKEN` | `demo-owner-token` | Bearer token for owner endpoints |
| `AUTH_DISABLED` | `false` | Set `true` to skip auth in dev |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated allowed origins |
| `PILOT_MIN_PROB` | `0.6` | Minimum P(improve) for Pilot gate |
| `STUDENT_RATE_LIMIT_PER_MIN` | `60` | Rate limit on `/student/offers` |
| `LLM_PROVIDER` | `gemini` | `gemini` or `openai` |
| `LLM_API_KEY` | *(empty)* | API key for LLM (service works without it) |
| `LLM_MODEL` | *(empty)* | Model name, e.g. `gemini-pro` |
