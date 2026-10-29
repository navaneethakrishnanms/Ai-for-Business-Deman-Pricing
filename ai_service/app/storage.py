"""SQLite persistence: guardrails, menu state, recommendations, override log, approved student offers."""
import json
import sqlite3
import threading
import uuid
from datetime import datetime, timezone

from .config import DB_PATH, Guardrails

_lock = threading.RLock()
SCHEMA = """
CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE IF NOT EXISTS menu_state (item_id TEXT PRIMARY KEY, price REAL, portion_size_g INTEGER);
CREATE TABLE IF NOT EXISTS combo_state (combo_id TEXT PRIMARY KEY, discount_pct REAL);
CREATE TABLE IF NOT EXISTS recommendations (rec_id TEXT PRIMARY KEY, created_at TEXT, body TEXT);
CREATE TABLE IF NOT EXISTS overrides (
  override_id TEXT PRIMARY KEY, rec_id TEXT, decision TEXT, edited_value REAL, note TEXT,
  status TEXT, decided_at TEXT, decided_by TEXT, kind TEXT, target_id TEXT, proposed REAL, current REAL);
CREATE TABLE IF NOT EXISTS offers (combo_id TEXT PRIMARY KEY, discount_pct REAL, source TEXT, approved_at TEXT);
"""


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class Store:
    def __init__(self, path=DB_PATH):
        path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(path), check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        with _lock:
            self.conn.executescript(SCHEMA)
            self.conn.commit()

    def _run(self, sql, args=(), many=False):
        with _lock:
            cur = self.conn.executemany(sql, args) if many else self.conn.execute(sql, args)
            self.conn.commit()
            return cur

    def _all(self, sql, args=()):
        with _lock:
            return [dict(r) for r in self.conn.execute(sql, args).fetchall()]

    # ----- guardrails ----------------------------------------------------------
    def get_guardrails(self) -> Guardrails:
        rows = self._all("SELECT v FROM kv WHERE k='guardrails'")
        return Guardrails(**json.loads(rows[0]["v"])) if rows else Guardrails()

    def set_guardrails(self, g: Guardrails):
        self._run("INSERT OR REPLACE INTO kv VALUES ('guardrails', ?)", (json.dumps(g.to_dict()),))

    # ----- menu state ------------------------------------------------------------
    def menu_state(self):
        return ({r["item_id"]: r for r in self._all("SELECT * FROM menu_state")},
                {r["combo_id"]: r["discount_pct"] for r in self._all("SELECT * FROM combo_state")})

    def seed_menu(self, items, combos):
        self._run("DELETE FROM menu_state")
        self._run("DELETE FROM combo_state")
        self._run("INSERT INTO menu_state VALUES (?,?,?)", [(k, p, g) for k, p, g in items], many=True)
        self._run("INSERT INTO combo_state VALUES (?,?)", combos, many=True)

    def set_item(self, item_id, price=None, portion=None):
        if price is not None:
            self._run("UPDATE menu_state SET price=? WHERE item_id=?", (price, item_id))
        if portion is not None:
            self._run("UPDATE menu_state SET portion_size_g=? WHERE item_id=?", (int(portion), item_id))

    def set_combo(self, combo_id, discount):
        self._run("UPDATE combo_state SET discount_pct=? WHERE combo_id=?", (discount, combo_id))

    # ----- recommendations and overrides -----------------------------------------
    def save_recommendations(self, recs):
        t = now_iso()
        self._run("INSERT OR REPLACE INTO recommendations VALUES (?,?,?)",
                  [(r["rec_id"], t, json.dumps(r)) for r in recs], many=True)

    def get_recommendation(self, rec_id):
        rows = self._all("SELECT body FROM recommendations WHERE rec_id=?", (rec_id,))
        return json.loads(rows[0]["body"]) if rows else None

    def add_override(self, rec, decision, edited_value, note, status, decided_by="owner"):
        oid = "ovr_" + uuid.uuid4().hex[:10]
        t = now_iso()
        target = rec.get("item_id") or rec.get("combo_id")
        self._run("INSERT INTO overrides VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                  (oid, rec["rec_id"], decision, edited_value, note, status, t, decided_by,
                   rec["kind"], target, rec.get("proposed"), rec.get("current")))
        return oid, t

    def list_overrides(self, limit=200):
        return self._all("SELECT * FROM overrides ORDER BY decided_at DESC, rowid DESC LIMIT ?", (limit,))

    def history(self, kind, target_id, limit=3):
        return self._all("SELECT decision, edited_value, note, decided_at, proposed FROM overrides "
                         "WHERE kind=? AND target_id=? ORDER BY rowid DESC LIMIT ?", (kind, target_id, limit))

    # ----- approved student offers --------------------------------------------------
    def offers(self):
        return self._all("SELECT * FROM offers")

    def set_offer(self, combo_id, discount_pct, source):
        self._run("INSERT OR REPLACE INTO offers VALUES (?,?,?,?)", (combo_id, discount_pct, source, now_iso()))

    def remove_offer(self, combo_id):
        self._run("DELETE FROM offers WHERE combo_id=?", (combo_id,))

    def clear_all(self):
        for t in ("recommendations", "overrides", "offers", "kv"):
            self._run(f"DELETE FROM {t}")
