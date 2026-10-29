-- CampusPrice MySQL Database Schema (PS 2.4)

CREATE TABLE IF NOT EXISTS menu_items (
  item_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  kind ENUM('main', 'addon') NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  portion_size_g INT NOT NULL,
  units_per_day DECIMAL(10, 2) NOT NULL,
  flags JSON NULL,
  portion_tiers JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS combos (
  combo_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  combo_items JSON NOT NULL,
  discount_pct DECIMAL(5, 2) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guardrails (
  id INT PRIMARY KEY DEFAULT 1,
  margin_floor_pct DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
  max_weekly_change_pct DECIMAL(5, 2) NOT NULL DEFAULT 15.00,
  student_price_cap DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
  coverage_target DECIMAL(5, 4) NOT NULL DEFAULT 0.7500,
  combo_discount_cap_pct DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
  fairness_mode BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS override_logs (
  override_id VARCHAR(50) PRIMARY KEY,
  rec_id VARCHAR(50) NOT NULL,
  decision ENUM('approve', 'edit', 'reject') NOT NULL,
  edited_value DECIMAL(10, 2) NULL,
  note TEXT NULL,
  decided_by VARCHAR(50) NOT NULL DEFAULT 'cafeteria_owner',
  decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
