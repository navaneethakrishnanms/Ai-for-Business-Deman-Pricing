"""FastAPI application – CampusPrice AI Decision Engine (PS 2.4).

Port: AI_PORT env (default 8001).  Auth: Bearer OWNER_TOKEN.
Run: uvicorn app.main:app --host 0.0.0.0 --port 8001
"""
import logging
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings, MODEL_VERSION
from app.state import startup
from app.api.endpoints import router as api_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

app = FastAPI(
    title="CampusPrice AI Decision Support Engine",
    description=(
        "PS 2.4 – AI-Powered Pricing and Combo Offer Decision Support. "
        "Layers: demand model, combo engine, student budget filter, "
        "profit-safe optimiser, Apply/Pilot/Hold gate, LLM assistant."
    ),
    version=MODEL_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── request-id middleware ─────────────────────────────────────────────────────
@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    rid = request.headers.get("X-Request-ID", "req_" + uuid.uuid4().hex[:12])
    response = await call_next(request)
    response.headers["X-Request-ID"] = rid
    return response


# ── startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup():
    startup()


# ── routes ───────────────────────────────────────────────────────────────────
app.include_router(api_router)   # no prefix – matches contract exactly


@app.get("/")
def root():
    return {
        "service": "CampusPrice AI Decision Engine",
        "version": MODEL_VERSION,
        "status": "online",
        "docs": "/docs",
    }
