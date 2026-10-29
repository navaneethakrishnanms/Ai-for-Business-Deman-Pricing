"""LLM assistant (Layer 6).

Provider and key from .env (LLM_API_KEY, LLM_MODEL, LLM_PROVIDER).
With no key, no internet, or any failure: rule-based parser + template explanations, fallback=True.
The LLM only turns text into a parsed_request and writes an explanation from computed numbers.
numbers_used[] lists the result paths it cites.  It never produces a number.
"""
from __future__ import annotations

import json
import re
from typing import Any, Dict, Optional

from ..config import settings

# ── rule-based parser ─────────────────────────────────────────────────────────

_PRICE_RE = re.compile(
    r"(raise|increase|lower|cut|reduce|decrease|change|set)\s+(?:the\s+)?(?:price\s+(?:of\s+)?)?(\w[\w\s]*?)\s+"
    r"(?:(?:price\s+)?(?:by\s+|to\s+))?(\d+(?:\.\d+)?)\s*(%|rs|rupees|₹)?",
    re.I,
)
_COMBO_RE = re.compile(
    r"combo\s+(?:of\s+)?(.+?)\s+(?:and|with|&|\+)\s+(.+?)\s+(?:at\s+)?(\d+(?:\.\d+)?)\s*%\s*(?:off|discount)?",
    re.I,
)
_COMPARE_RE = re.compile(r"\bcompare\b", re.I)
_RECOMMEND_RE = re.compile(r"\brecommend\b|\boptimis\b|\boptimize\b", re.I)


def _parse_rule(text: str) -> dict:
    if _COMPARE_RE.search(text):
        return {"intent": "compare", "raw": text}
    if _RECOMMEND_RE.search(text):
        return {"intent": "recommend", "raw": text}
    m = _COMBO_RE.search(text)
    if m:
        return {"intent": "combo_evaluate", "main": m.group(1).strip(),
                "addon": m.group(2).strip(), "discount_pct": float(m.group(3))}
    m = _PRICE_RE.search(text)
    if m:
        action, item, val, unit = m.groups()
        unit = (unit or "%").lower()
        pct = float(val) if "%" in unit else None
        abs_price = float(val) if "%" not in unit else None
        direction = "raise" if action.lower() in ("raise", "increase") else "lower"
        return {"intent": "predict", "item": item.strip(), "direction": direction,
                "change_pct": pct, "abs_price": abs_price}
    return {"intent": "unknown", "raw": text}


def _template_explain(parsed: dict, result: Any) -> tuple[str, list]:
    intent = parsed.get("intent", "unknown")
    numbers_used = []
    if intent == "predict":
        item = parsed.get("item", "")
        if isinstance(result, dict) and "units" in result:
            u = result["units"]
            p = result.get("profit", {})
            numbers_used = ["units.mean", "units.p10", "units.p90", "profit.mean"]
            expl = (
                f"If you {parsed.get('direction', 'change')} the price of {item}, "
                f"the model estimates about {u['mean']:.0f} units/day "
                f"(range {u['p10']:.0f}–{u['p90']:.0f}). "
                f"Expected profit: Rs {p.get('mean', 0):.0f}/day "
                f"({p.get('p10', 0):.0f}–{p.get('p90', 0):.0f}). "
                "These are model estimates based on price-response data, not guarantees."
            )
            return expl, numbers_used
    if intent == "compare":
        return "The comparison shows Today first; look at delta_vs_today.profit to see which scenario adds more profit.", ["delta_vs_today.profit"]
    if intent == "recommend":
        return "The recommendation engine found the price and portion changes most likely to improve profit within your guardrails.", ["summary.estimated_profit_delta", "summary.coverage_optimised"]
    return "I understood your question but could not produce a specific explanation. Please check the structured result.", []


# ── LLM call (optional) ───────────────────────────────────────────────────────

def _llm_call(text: str, context: dict) -> Optional[dict]:
    """Try the configured LLM provider. Returns None on any failure."""
    if not settings.llm_api_key:
        return None
    try:
        provider = settings.llm_provider.lower()
        if provider == "groq":
            return _groq_call(text, context)
        if provider == "gemini":
            return _gemini_call(text, context)
        if provider in ("openai", "openai-compatible"):
            return _openai_call(text, context)
    except Exception:
        pass
    return None


def _groq_call(text: str, context: dict) -> Optional[dict]:
    try:
        from groq import Groq
    except ImportError:
        return None
    client = Groq(api_key=settings.llm_api_key)
    prompt = _build_prompt(text, context)
    completion = client.chat.completions.create(
        model=settings.llm_model or "openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        temperature=1,
        max_completion_tokens=2048,
        top_p=1,
        reasoning_effort="medium",
        stream=False,
        stop=None,
    )
    raw = completion.choices[0].message.content or ""
    clean = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.MULTILINE).strip()
    return json.loads(clean)


def _gemini_call(text: str, context: dict) -> Optional[dict]:
    import httpx
    prompt = _build_prompt(text, context)
    resp = httpx.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{settings.llm_model or 'gemini-pro'}:generateContent",
        params={"key": settings.llm_api_key},
        json={"contents": [{"parts": [{"text": prompt}]}]},
        timeout=10,
    )
    resp.raise_for_status()
    raw = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    return json.loads(raw)


def _openai_call(text: str, context: dict) -> Optional[dict]:
    import httpx
    prompt = _build_prompt(text, context)
    resp = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {settings.llm_api_key}"},
        json={"model": settings.llm_model or "gpt-4o-mini",
              "messages": [{"role": "user", "content": prompt}],
              "response_format": {"type": "json_object"}},
        timeout=10,
    )
    resp.raise_for_status()
    raw = resp.json()["choices"][0]["message"]["content"]
    return json.loads(raw)


def _build_prompt(text: str, context: dict) -> str:
    return f"""You are a pricing assistant for a campus canteen. Parse the following manager query into a
structured JSON object with keys: intent (one of predict/compare/recommend/combo_evaluate/unknown),
and any relevant fields (item_id, direction, change_pct, abs_price, main_item_id, addon_item_id,
discount_pct). Return ONLY valid JSON with no commentary.

Query: {text}
Context: {json.dumps(context)}"""


# ── main entry ────────────────────────────────────────────────────────────────

def query(text: str, context: dict) -> dict:
    """Parse a natural-language query; call the relevant engine; return explanation."""
    from ..state import get_engine, get_optimizer

    fallback = True
    parsed = _parse_rule(text)

    # try LLM override of the parse
    llm_parsed = _llm_call(text, context)
    if llm_parsed and "intent" in llm_parsed:
        parsed = llm_parsed
        fallback = False

    result = None
    numbers_used: list = []
    explanation = ""

    eng = get_engine()
    opt = get_optimizer()

    try:
        intent = parsed.get("intent")
        if intent == "predict":
            # resolve item name to id
            item_id = _resolve_item(parsed.get("item", ""), eng)
            today = eng.today()
            i = eng.idx.get(item_id)
            current_price = float(today.price[i]) if i is not None else 0.0
            change_pct = parsed.get("change_pct")
            abs_price = parsed.get("abs_price")
            if abs_price:
                price = abs_price
            elif change_pct is not None:
                direction = parsed.get("direction", "raise")
                factor = 1 + change_pct / 100 if direction == "raise" else 1 - change_pct / 100
                price = round(current_price * factor * 2) / 2
            else:
                price = current_price
            result = eng.predict(item_id, price, int(today.portion[i]) if i is not None else 200,
                                 0.0, "regular")
            explanation, numbers_used = _template_explain(parsed, result)
        elif intent == "recommend":
            result = opt.recommend()
            explanation, numbers_used = _template_explain(parsed, result)
        elif intent == "compare":
            explanation = "Use POST /scenarios/compare with your scenario definitions."
            result = {}
            numbers_used = []
        else:
            explanation = "I could not understand the request. Try: 'raise Dosa price by 10%' or 'recommend'."
            result = {}
    except Exception as e:
        explanation = f"Could not process the request: {e}"
        result = {}

    return {
        "parsed_request": parsed,
        "result": result,
        "explanation": explanation,
        "numbers_used": numbers_used,
        "fallback": fallback,
    }


def _resolve_item(name: str, eng) -> str:
    """Fuzzy resolve a name to item_id."""
    name_l = name.lower()
    # exact
    if name_l in eng.idx:
        return name_l
    # partial match on item names
    for iid, display in eng.names.items():
        if name_l in display.lower() or name_l in iid.lower():
            return iid
    # fallback: first item
    return eng.ids[0]
