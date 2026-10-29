from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

router = APIRouter()

class DemandPredictRequest(BaseModel):
    item_id: str
    price: float
    portion_g: float
    discount_pct: float
    day_type: str  # 'regular', 'exam', 'weekend', 'event'

class ComboEvaluateRequest(BaseModel):
    main_item_id: str
    addon_item_id: str
    combo_discount_pct: float

@router.post("/predict")
def predict_demand(req: DemandPredictRequest):
    """Template endpoint for Layer 1: Demand Response calculation"""
    return {
        "item_id": req.item_id,
        "predicted_units": 120.0,
        "uncertainty_band": {"lower": 102.0, "upper": 138.0},
        "revenue": req.price * 120.0,
        "guardrail_status": "ok"
    }

@router.post("/evaluate-combo")
def evaluate_combo(req: ComboEvaluateRequest):
    """Template endpoint for Layer 2: Combo cannibalisation and incremental profit"""
    return {
        "combo": f"{req.main_item_id} + {req.addon_item_id}",
        "discount_pct": req.combo_discount_pct,
        "cannibalisation_risk": "low",
        "break_even_take_rate": 0.42,
        "incremental_profit_range": {"min": 450.0, "max": 780.0}
    }
