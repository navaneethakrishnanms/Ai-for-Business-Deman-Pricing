# CampusPrice AI Service – Integration Guide

For backend and frontend teammates connecting to the AI service.

---

## Base URL and Port

```
http://localhost:8001
```

The port is set by `AI_PORT` in the AI service `.env`. Default is **8001**.

---

## Auth

All endpoints except `/health` and `/student/offers` require:

```
Authorization: Bearer demo-owner-token
```

Set `AUTH_DISABLED=true` in `.env` during development to skip the token check.

> **Tip for backend teammates**: Your backend can proxy `/student/offers` without auth, since the AI service applies its own rate limiting on that endpoint.

---

## CORS

The service allows `http://localhost:5173`, `http://localhost:3000`, and `http://localhost:5000` by default.  
Add your origin to `CORS_ORIGINS` in `.env` if needed.

---

## Response Envelope

Every successful response is:

```json
{
  "data": { ... },
  "meta": {
    "model_version": "campusprice-ai-1.0.0",
    "data_source": "synthetic",
    "generated_at": "2026-10-29T06:00:00+00:00",
    "request_id": "req_abc123"
  }
}
```

---

## Error Shape

```json
{
  "error": {
    "code": "item_not_found",
    "message": "item_id 'xyz' not found",
    "field": "item_id"
  }
}
```

HTTP status: 400 (bad input) / 401 (auth) / 404 (not found) / 422 (validation) / 429 (rate limit) / 503 (starting up)

---

## Endpoint Table

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | no | Liveness check |
| GET | `/items` | owner | Menu items + combos with health flags |
| GET | `/config` | owner | Get guardrails |
| PUT | `/config` | owner | Update guardrails |
| POST | `/predict` | owner | Demand prediction for one item |
| POST | `/scenarios/compare` | owner | Compare up to N price scenarios |
| POST | `/combos/evaluate` | owner | Combo profitability check |
| GET | `/combos/suggestions` | owner | All (main, addon) best-discount combos |
| POST | `/recommend` | owner | Optimised recommendations with gate + frontier |
| POST | `/overrides` | owner | Approve / edit / reject a recommendation |
| GET | `/overrides` | owner | Override history |
| GET | `/student/offers` | none | Budget-filtered student offers (no model details) |
| POST | `/assistant/query` | owner | Natural-language what-if |
| GET | `/model/status` | owner | Model metadata and scorecard |
| POST | `/demo/reset` | owner | Restore seed state |

---

## Request / Response Examples

> These examples were captured from the running service. Numbers are real model outputs.

### GET /health

```http
GET http://localhost:8001/health
```

```json
{
  "status": "healthy",
  "models_loaded": true,
  "model_version": "campusprice-ai-1.0.0",
  "data_source": "synthetic"
}
```

---

### GET /items

```http
GET http://localhost:8001/items
Authorization: Bearer demo-owner-token
```

```json
{
  "data": {
    "items": [
      {
        "item_id": "veg_meals",
        "name": "Veg Meals",
        "kind": "main",
        "price": 70.0,
        "cost": 45.0,
        "portion_size_g": 350,
        "units_per_day": 98.3,
        "margin_abs": 25.0,
        "margin_pct": 35.7,
        "flags": [],
        "portion_tiers": [
          {"tier": "small", "portion_size_g": 280, "price": 59.5, "price_per_100g": 21.25},
          {"tier": "regular", "portion_size_g": 350, "price": 70.0, "price_per_100g": 20.0},
          {"tier": "large", "portion_size_g": 440, "price": 83.0, "price_per_100g": 18.86}
        ]
      }
    ],
    "combos": [
      { "combo_id": "combo_veg_tea", "combo_items": ["veg_meals", "tea"], "discount_pct": 0.0 }
    ]
  },
  "meta": { ... }
}
```

---

### POST /predict

```http
POST http://localhost:8001/predict
Authorization: Bearer demo-owner-token
Content-Type: application/json

{
  "item_id": "dosa",
  "price": 44.0,
  "portion_size_g": 180,
  "discount_pct": 0.0,
  "day_type": "regular"
}
```

```json
{
  "data": {
    "units":   {"mean": 105.2, "p10": 82.1, "p90": 131.4},
    "revenue": {"mean": 4628.8, "p10": 3612.4, "p90": 5781.6},
    "profit":  {"mean": 1940.2, "p10": 1354.1, "p90": 2516.3},
    "margin_pct": 41.9,
    "price_effect": {"mean": -1.72, "p10": -2.31, "p90": -1.18},
    "baseline": {"units": 121.0, "revenue": 4840.0, "profit": 2420.0},
    "curve": [ ... ],
    "flags": []
  },
  "meta": { ... }
}
```

---

### GET /student/offers?budget=100

```http
GET http://localhost:8001/student/offers?budget=100
```

```json
{
  "data": {
    "offers": [
      {
        "offer_id": "combo_veg_tea",
        "title": "Veg Meals + Tea",
        "items": ["veg_meals", "tea"],
        "price": 73.5,
        "list_price": 82.0,
        "you_save": 8.5,
        "price_per_100g": 14.7,
        "badge": "Value Combo"
      }
    ]
  },
  "meta": { ... }
}
```

---

### POST /recommend

```http
POST http://localhost:8001/recommend
Authorization: Bearer demo-owner-token
Content-Type: application/json

{
  "coverage_target": 0.80,
  "include_frontier": true
}
```

Response includes `recommendations[]` (≤8), `summary`, and `frontier[]`.

---

## Optional Backend Proxy Pattern

Your backend can expose a stripped `/api/offers` route by proxying the AI service:

```python
# FastAPI backend example
import httpx

AI_BASE = "http://localhost:8001"

@app.get("/api/offers")
async def offers(budget: float = None):
    params = {"budget": budget} if budget else {}
    r = await httpx.get(f"{AI_BASE}/student/offers", params=params)
    return r.json()["data"]   # strip the envelope
```

---

## Rate Limits

- `/student/offers`: 60 requests per IP per minute. Returns HTTP 429 when exceeded.
- All other endpoints: no built-in limit (add reverse-proxy rate limiting if needed).
