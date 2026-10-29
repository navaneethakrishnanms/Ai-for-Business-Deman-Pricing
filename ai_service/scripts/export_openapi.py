"""Export OpenAPI schema to ai_service/openapi.json.

Works standalone – does NOT need a running server.
Run: python scripts/export_openapi.py
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def main():
    # startup() loads model from cache; fails gracefully if artifacts missing
    from app.state import startup
    try:
        startup()
    except Exception:
        pass  # schema export doesn't need a fitted model

    from app.main import app
    schema = app.openapi()
    out = ROOT / "openapi.json"
    out.write_text(json.dumps(schema, indent=2))
    print(f"openapi.json written to {out}  ({len(schema.get('paths', {}))} paths)")


if __name__ == "__main__":
    main()
