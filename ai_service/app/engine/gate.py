"""Apply / Pilot / Hold gate and pilot plan builder.

Apply  : P(improve) >= APPLY_PROB  (default 0.80)
Pilot  : P(improve) >= PILOT_MIN_PROB (env, default 0.60)
Hold   : otherwise
"""
import os

from ..config import APPLY_PROB

PILOT_MIN_PROB = float(os.getenv("PILOT_MIN_PROB", "0.6"))


def gate(prob: float, mean_delta: float) -> str:
    if prob >= APPLY_PROB and mean_delta > 0:
        return "apply"
    if prob >= PILOT_MIN_PROB and mean_delta > 0:
        return "pilot"
    return "hold"


def pilot_plan(item_id: str, kind: str, proposed, current, day_type_mix: dict) -> dict:
    """One-week A/B pilot plan."""
    day_types = list(day_type_mix.keys()) if day_type_mix else ["regular", "exam", "weekend", "event"]
    arms = [
        {"label": "control", "value": current, "days": [d for i, d in enumerate(day_types) if i % 2 == 0]},
        {"label": "test",    "value": proposed, "days": [d for i, d in enumerate(day_types) if i % 2 != 0]},
    ]
    return {
        "duration_days": 7,
        "target": item_id,
        "kind": kind,
        "arms": arms,
        "measure": "daily_profit",
        "note": "Record units sold and revenue for both arms each day. Compare with a paired t-test after 7 days.",
    }
