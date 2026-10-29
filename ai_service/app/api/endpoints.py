"""All API endpoints matching the CampusPrice API Contract (PDF, section 5).

Envelope: {data, meta{model_version, data_source, generated_at, request_id}}
Error:    {error{code, message, field}} with 400/401/404/422/429/503
"""
from __future__ import annotations

import json
import time
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

from ..config import MODEL_VERSION, DATA_SOURCE, settings, Guardrails, SCORECARD_PATH, KAGGLE_FINDINGS_PATH
from ..state import get_engine, get_optimizer, get_store

router = APIRouter()

# ── rate limiting (in-memory, per-IP, student endpoint only) ──────────────────
_student_hits: Dict[str, list] = defaultdict(list)


def _check_student_rate(request: Request):
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    window = 60
    hits = [t for t in _student_hits[ip] if now - t < window]
    if len(hits) >= settings.student_rate_limit_per_min:
        raise HTTPException(status_code=429, detail={"error": {"code": "rate_limit_exceeded",
            "message": "Too many requests. Please slow down.", "field": None}})
    hits.append(now)
    _student_hits[ip] = hits


# ── auth ──────────────────────────────────────────────────────────────────────
def _check_auth(authorization: Optional[str] = Header(default=None)):
    if settings.auth_disabled:
        return
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail={"error": {"code": "missing_token",
            "message": "Authorization: Bearer <token> required", "field": None}})
    token = authorization.removeprefix("Bearer ").strip()
    if token != settings.owner_token:
        raise HTTPException(status_code=401, detail={"error": {"code": "invalid_token",
            "message": "Invalid owner token", "field": None}})


# ── envelope helpers ──────────────────────────────────────────────────────────
def _now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _meta(request_id: str | None = None) -> dict:
    return {
        "model_version": MODEL_VERSION,
        "data_source": DATA_SOURCE,
        "generated_at": _now_iso(),
        "request_id": request_id or ("req_" + uuid.uuid4().hex[:12]),
    }


def _wrap(data, request_id=None):
    return {"data": data, "meta": _meta(request_id)}


def _err(status: int, code: str, message: str, field=None):
    return JSONResponse(status_code=status,
                        content={"error": {"code": code, "message": message, "field": field}})


DAY_TYPES = ("regular", "exam", "weekend", "event")


def _validate_day_type(dt: str):
    if dt not in DAY_TYPES:
        raise HTTPException(status_code=422, detail={"error": {"code": "invalid_day_type",
            "message": f"day_type must be one of {DAY_TYPES}", "field": "day_type"}})


# ── Pydantic models ───────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    item_id: str
    price: float = Field(gt=0)
    portion_size_g: int = Field(gt=0)
    discount_pct: float = Field(ge=0, le=100)
    day_type: str


class ItemChange(BaseModel):
    item_id: str
    price: Optional[float] = None
    portion_size_g: Optional[int] = None


class ComboChange(BaseModel):
    combo_id: str
    discount_pct: float = Field(ge=0, le=100)


class Scenario(BaseModel):
    name: str
    item_changes: List[ItemChange] = []
    combo_changes: List[ComboChange] = []


class ScenariosCompareRequest(BaseModel):
    scenarios: List[Scenario]
    day_type_mix: Optional[Dict[str, float]] = None


class ComboEvaluateRequest(BaseModel):
    main_item_id: str
    addon_item_id: str
    discount_pct: float = Field(ge=0, le=100)
    day_type: str = "regular"


class RecommendRequest(BaseModel):
    coverage_target: Optional[float] = Field(default=None, ge=0, le=1)
    day_type_mix: Optional[Dict[str, float]] = None
    include_frontier: bool = False


class OverrideRequest(BaseModel):
    rec_id: str
    decision: str   # approve | edit | reject
    edited_value: Optional[float] = None
    note: Optional[str] = None


class GuardrailsUpdate(BaseModel):
    margin_floor_pct: Optional[float] = None
    max_weekly_change_pct: Optional[float] = None
    student_price_cap: Optional[float] = None
    coverage_target: Optional[float] = None
    combo_discount_cap_pct: Optional[float] = None
    fairness_mode: Optional[bool] = None


class AssistantRequest(BaseModel):
    text: str
    context: Optional[Dict[str, Any]] = None


# ── /health ───────────────────────────────────────────────────────────────────

@router.get("/health")
def health():
    try:
        eng = get_engine()
        return {"status": "healthy", "models_loaded": True,
                "model_version": MODEL_VERSION, "data_source": DATA_SOURCE}
    except RuntimeError:
        return JSONResponse(status_code=503, content={"status": "starting", "models_loaded": False})


# ── GET /items ────────────────────────────────────────────────────────────────

@router.get("/items")
def list_items(auth=Depends(_check_auth)):
    eng = get_engine()
    items = eng.health()
    combos = eng.combos_view()
    return _wrap({"items": items, "combos": combos})


# ── GET /config, PUT /config ─────────────────────────────────────────────────

@router.get("/config")
def get_config(auth=Depends(_check_auth)):
    store = get_store()
    return _wrap(store.get_guardrails().to_dict())


@router.put("/config")
def put_config(body: GuardrailsUpdate, auth=Depends(_check_auth)):
    store = get_store()
    g = store.get_guardrails()
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    for k, v in update.items():
        setattr(g, k, v)
    store.set_guardrails(g)
    return _wrap(g.to_dict())


# ── POST /predict ─────────────────────────────────────────────────────────────

@router.post("/predict")
def predict(body: PredictRequest, auth=Depends(_check_auth)):
    _validate_day_type(body.day_type)
    eng = get_engine()
    if body.item_id not in eng.idx:
        return _err(404, "item_not_found", f"item_id '{body.item_id}' not found", "item_id")
    result = eng.predict(body.item_id, body.price, body.portion_size_g, body.discount_pct, body.day_type)
    return _wrap(result)


# ── POST /scenarios/compare ───────────────────────────────────────────────────

@router.post("/scenarios/compare")
def scenarios_compare(body: ScenariosCompareRequest, auth=Depends(_check_auth)):
    eng = get_engine()
    mix = eng.mix(body.day_type_mix)
    sc_list = [s.model_dump() for s in body.scenarios]
    results = eng.compare(sc_list, mix)
    return _wrap({"results": results})


# ── POST /combos/evaluate ────────────────────────────────────────────────────

@router.post("/combos/evaluate")
def combos_evaluate(body: ComboEvaluateRequest, auth=Depends(_check_auth)):
    _validate_day_type(body.day_type)
    eng = get_engine()
    if body.main_item_id not in eng.idx:
        return _err(404, "item_not_found", f"main_item_id '{body.main_item_id}' not found", "main_item_id")
    if body.addon_item_id not in eng.idx:
        return _err(404, "item_not_found", f"addon_item_id '{body.addon_item_id}' not found", "addon_item_id")
    result = eng.combo_eval(body.main_item_id, body.addon_item_id, body.discount_pct, body.day_type)
    return _wrap(result)


# ── GET /combos/suggestions ───────────────────────────────────────────────────

@router.get("/combos/suggestions")
def combos_suggestions(auth=Depends(_check_auth)):
    eng = get_engine()
    suggestions = eng.combo_suggestions()
    return _wrap({"suggestions": suggestions})


# ── POST /recommend ───────────────────────────────────────────────────────────

@router.post("/recommend")
def recommend(body: RecommendRequest, auth=Depends(_check_auth)):
    opt = get_optimizer()
    store = get_store()
    result = opt.recommend(
        coverage_target=body.coverage_target,
        day_type_mix=body.day_type_mix,
        include_frontier=body.include_frontier,
    )
    # persist recommendations for override workflow
    recs = result["recommendations"]
    if recs:
        store.save_recommendations(recs)
    return _wrap(result)


# ── POST /overrides, GET /overrides ──────────────────────────────────────────

@router.post("/overrides")
def post_override(body: OverrideRequest, auth=Depends(_check_auth)):
    store = get_store()
    eng = get_engine()
    if body.decision not in ("approve", "edit", "reject"):
        return _err(422, "invalid_decision", "decision must be approve | edit | reject", "decision")
    rec = store.get_recommendation(body.rec_id)
    if rec is None:
        return _err(404, "rec_not_found", f"rec_id '{body.rec_id}' not found", "rec_id")
    oid, decided_at = store.add_override(rec, body.decision, body.edited_value, body.note or "", "ok")
    # apply state changes
    if body.decision in ("approve", "edit"):
        val = body.edited_value
        if rec["kind"] == "item":
            price = val if body.decision == "edit" else rec.get("proposed_price")
            portion = rec.get("proposed_portion_g")
            if price:
                store.set_item(rec["item_id"], price=price)
            if portion:
                store.set_item(rec["item_id"], portion=portion)
        elif rec["kind"] == "combo":
            disc = val if body.decision == "edit" else rec.get("proposed_discount_pct", 0)
            store.set_combo(rec["combo_id"], disc)
            store.set_offer(rec["combo_id"], disc, "override")
    return _wrap({"override_id": oid, "decided_at": decided_at, "status": "recorded"})


@router.get("/overrides")
def get_overrides(limit: int = 50, auth=Depends(_check_auth)):
    store = get_store()
    rows = store.list_overrides(limit=limit)
    return _wrap({"overrides": rows})


# ── GET /student/offers ───────────────────────────────────────────────────────

@router.get("/student/offers")
def student_offers(request: Request, budget: Optional[float] = Query(default=None, ge=0)):
    _check_student_rate(request)
    store = get_store()
    eng = get_engine()
    raw = store.offers()
    today = eng.today()
    out = []
    for row in raw:
        # find combo by combo_id
        cb = next((c for c in eng.combos if c.combo_id == row["combo_id"]), None)
        if cb is None:
            continue
        im, ia = cb.main, cb.addon
        disc = float(row["discount_pct"])
        mp = float(today.price[im])
        ap = float(today.price[ia])
        list_price = round(mp + ap, 2)
        combo_price = round(list_price * (1 - disc / 100.0), 2)
        you_save = round(list_price - combo_price, 2)
        if budget is not None and combo_price > budget:
            continue
        grams = int(today.portion[im]) + int(today.portion[ia])
        pper100 = round(combo_price / grams * 100, 2) if grams else 0.0
        badge = "Budget Pick" if combo_price <= 80 else ("Value Combo" if disc >= 10 else "Combo Deal")
        out.append(dict(
            offer_id=row["combo_id"],
            title=eng.names.get(eng.ids[im], eng.ids[im]) + " + " + eng.names.get(eng.ids[ia], eng.ids[ia]),
            items=[eng.ids[im], eng.ids[ia]],
            price=combo_price,
            list_price=list_price,
            you_save=you_save,
            price_per_100g=pper100,
            badge=badge,
        ))
        if len(out) >= 3:
            break
    return _wrap({"offers": out})


# ── GET /model/status ─────────────────────────────────────────────────────────

@router.get("/model/status")
def model_status(auth=Depends(_check_auth)):
    eng = get_engine()
    meta = eng.bundle.meta
    val = meta.get("validation", {})
    # naive vs randomised gap
    naive_beta = eng.bundle.naive_beta
    point_beta = eng.bundle.point["beta"]
    gap_mean = float((naive_beta - point_beta).mean()) if naive_beta is not None else None
    # real data check from kaggle findings
    real_check = None
    if KAGGLE_FINDINGS_PATH.exists():
        kf = json.loads(KAGGLE_FINDINGS_PATH.read_text())
        real_check = {
            "pooled_effect": kf["pooled_log_log_fe"]["coef"],
            "ci": [kf["pooled_log_log_fe"]["ci_low"], kf["pooled_log_log_fe"]["ci_high"]],
            "product_wape_range": [
                kf["backtests"][0]["wape_product_average"],
                kf["backtests"][-1]["wape_product_average"],
            ],
        }
    scorecard = None
    if SCORECARD_PATH.exists():
        scorecard = json.loads(SCORECARD_PATH.read_text())
    # challenger cross-check
    challenger = None
    from ..engine.challenger import load as load_challenger
    chal_data = load_challenger()
    if chal_data:
        challenger = {
            "disagree_pct": chal_data.get("disagree_with_monotone_pct"),
            "train_rmse": chal_data.get("train_rmse"),
            "note": chal_data.get("note"),
        }
    return _wrap({
        "model_version": MODEL_VERSION,
        "trained_through": eng.trained_through,
        "data_source": DATA_SOURCE,
        "validation": {
            "metric": "holdout_direction_hit_rate",
            "value": val.get("holdout_direction_hit_rate", 0.0),
        },
        "holdout_unit_wape": val.get("holdout_unit_wape"),
        "tau_beta": meta.get("tau_beta"),
        "n_boot": meta.get("n_boot"),
        "n_rows": meta.get("n_rows"),
        "naive_vs_randomised_gap": gap_mean,
        "real_data_check": real_check,
        "scorecard": scorecard,
        "challenger": challenger,
    })


# ── POST /assistant/query ─────────────────────────────────────────────────────

@router.post("/assistant/query")
def assistant_query(body: AssistantRequest, auth=Depends(_check_auth)):
    from ..llm.assistant import query as _llm_query
    result = _llm_query(body.text, body.context or {})
    return _wrap(result)


# ── POST /demo/reset ──────────────────────────────────────────────────────────

@router.post("/demo/reset")
def demo_reset(auth=Depends(_check_auth)):
    eng = get_engine()
    store = get_store()
    store.clear_all()
    eng.reset_state()
    # re-seed offers
    from ..state import _seed_offers
    _seed_offers()
    return _wrap({"status": "reset", "message": "Demo state restored to seed."})
