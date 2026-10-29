"""Settings, paths, constants and default guardrails. Environment comes from .env (git-ignored)."""
import os
from dataclasses import dataclass, asdict
from pathlib import Path

import yaml
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

DATA_DIR = ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
SYNTH_DIR = DATA_DIR / "synthetic"
ARTIFACT_DIR = ROOT / "artifacts"
GRADER_DIR = ROOT / "grader_data"          # hidden truth: never read by anything under app/ except app/synth
DB_PATH = DATA_DIR / "ai_service.db"
TIER_PARAMS_PATH = ROOT / "config" / "tier_params.yaml"
KAGGLE_FINDINGS_PATH = DATA_DIR / "kaggle_findings.json"
SCORECARD_PATH = DATA_DIR / "scorecard.json"

MODEL_VERSION = "campusprice-ai-1.0.0"
DATA_SOURCE = "synthetic"
DAY_TYPES = ("regular", "exam", "weekend", "event")
N_BOOT = 200
SEED = 2026

PRICE_GRID = (-0.15, -0.10, -0.05, 0.0, 0.05, 0.10, 0.15)
COMBO_DISCOUNTS = (0.0, 5.0, 10.0, 15.0)
PORTION_TIER_MULT = {"small": 0.8, "regular": 1.0, "large": 1.25}
APPLY_PROB = 0.80


def _env_bool(name, default=False):
    return os.getenv(name, str(default)).strip().lower() in ("1", "true", "yes")


def _origins():
    raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost:5000")
    return [o.strip() for o in raw.split(",") if o.strip()]


@dataclass
class Settings:
    host: str = os.getenv("AI_HOST", "0.0.0.0")
    port: int = int(os.getenv("AI_PORT", os.getenv("PORT", "8000")))
    owner_token: str = os.getenv("OWNER_TOKEN", "demo-owner-token")
    auth_disabled: bool = _env_bool("AUTH_DISABLED", False)
    cors_origins: tuple = tuple(_origins())
    pilot_min_prob: float = float(os.getenv("PILOT_MIN_PROB", "0.6"))
    llm_api_key: str = os.getenv("LLM_API_KEY", "")
    llm_model: str = os.getenv("LLM_MODEL", "")
    llm_provider: str = os.getenv("LLM_PROVIDER", "gemini")
    student_rate_limit_per_min: int = int(os.getenv("STUDENT_RATE_LIMIT_PER_MIN", "60"))


settings = Settings()


@dataclass
class Guardrails:
    margin_floor_pct: float = 15.0
    max_weekly_change_pct: float = 10.0
    student_price_cap: float = 120.0
    coverage_target: float = 0.80
    combo_discount_cap_pct: float = 15.0
    fairness_mode: bool = True

    def to_dict(self):
        return asdict(self)


def load_tier_params(path: Path = TIER_PARAMS_PATH) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8"))
