import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/campusprice.sqlite');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize base schema
db.exec(`
  CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    cost REAL NOT NULL,
    portion_size_g REAL NOT NULL,
    units_per_day REAL NOT NULL,
    role TEXT NOT NULL, -- 'main', 'addon', 'combo'
    flag TEXT DEFAULT 'normal' -- 'loss_maker', 'poor_seller', 'star', 'normal'
  );

  CREATE TABLE IF NOT EXISTS scenarios (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS override_logs (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    item_id TEXT,
    action TEXT NOT NULL, -- 'approve', 'pilot', 'hold', 'manual_override'
    previous_value REAL,
    new_value REAL,
    reason TEXT
  );
`);

console.log('[CampusPrice DB] Initialized SQLite schema at:', dbPath);
