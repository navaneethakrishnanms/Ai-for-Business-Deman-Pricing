import { pool, withTransaction } from './index.js';

export const SEED_ITEMS = [
  {
    item_id: 'item_biryani',
    name: 'Chicken Biryani',
    kind: 'main',
    price: 90.00,
    cost: 96.00,
    portion_size_g: 400,
    units_per_day: 70.0,
    flags: JSON.stringify(['loss_maker']),
    portion_tiers: JSON.stringify([
      { tier: 'regular', portion_size_g: 400, price: 90.00 },
      { tier: 'half', portion_size_g: 220, price: 55.00 }
    ])
  },
  {
    item_id: 'item_paneer_roll',
    name: 'Paneer Roll',
    kind: 'main',
    price: 55.00,
    cost: 57.00,
    portion_size_g: 200,
    units_per_day: 40.0,
    flags: JSON.stringify(['loss_maker']),
    portion_tiers: JSON.stringify([
      { tier: 'regular', portion_size_g: 200, price: 55.00 }
    ])
  },
  {
    item_id: 'item_dosa',
    name: 'Masala Dosa',
    kind: 'main',
    price: 40.00,
    cost: 24.00,
    portion_size_g: 250,
    units_per_day: 180.0,
    flags: JSON.stringify(['star']),
    portion_tiers: JSON.stringify([
      { tier: 'single', portion_size_g: 250, price: 40.00 },
      { tier: 'double', portion_size_g: 450, price: 70.00 }
    ])
  },
  {
    item_id: 'item_veg_meals',
    name: 'Veg Full Meals',
    kind: 'main',
    price: 70.00,
    cost: 45.00,
    portion_size_g: 500,
    units_per_day: 120.0,
    flags: JSON.stringify([]),
    portion_tiers: JSON.stringify([
      { tier: 'mini', portion_size_g: 300, price: 45.00 },
      { tier: 'standard', portion_size_g: 500, price: 70.00 }
    ])
  },
  {
    item_id: 'item_salad',
    name: 'Salad Bowl',
    kind: 'main',
    price: 65.00,
    cost: 45.00,
    portion_size_g: 280,
    units_per_day: 10.0,
    flags: JSON.stringify(['poor_seller']),
    portion_tiers: JSON.stringify([
      { tier: 'regular', portion_size_g: 280, price: 65.00 }
    ])
  },
  {
    item_id: 'item_fresh_juice',
    name: 'Fresh Fruit Juice',
    kind: 'addon',
    price: 45.00,
    cost: 30.00,
    portion_size_g: 300,
    units_per_day: 10.0,
    flags: JSON.stringify(['poor_seller']),
    portion_tiers: JSON.stringify([
      { tier: 'regular', portion_size_g: 300, price: 45.00 }
    ])
  },
  {
    item_id: 'item_tea',
    name: 'Special Chai',
    kind: 'addon',
    price: 15.00,
    cost: 5.00,
    portion_size_g: 150,
    units_per_day: 260.0,
    flags: JSON.stringify(['star']),
    portion_tiers: JSON.stringify([
      { tier: 'regular', portion_size_g: 150, price: 15.00 }
    ])
  },
  {
    item_id: 'item_cold_coffee',
    name: 'Cold Coffee',
    kind: 'addon',
    price: 35.00,
    cost: 15.00,
    portion_size_g: 250,
    units_per_day: 85.0,
    flags: JSON.stringify([]),
    portion_tiers: JSON.stringify([
      { tier: 'regular', portion_size_g: 250, price: 35.00 }
    ])
  }
];

export const SEED_COMBOS = [
  {
    combo_id: 'combo_meals_tea',
    name: 'Veg Meals + Special Chai',
    combo_items: JSON.stringify(['item_veg_meals', 'item_tea']),
    discount_pct: 10.00,
    active: 1
  },
  {
    combo_id: 'combo_dosa_coffee',
    name: 'Dosa + Cold Coffee',
    combo_items: JSON.stringify(['item_dosa', 'item_cold_coffee']),
    discount_pct: 12.00,
    active: 1
  },
  {
    combo_id: 'combo_biryani_juice',
    name: 'Chicken Biryani + Fresh Juice',
    combo_items: JSON.stringify(['item_biryani', 'item_fresh_juice']),
    discount_pct: 15.00,
    active: 1
  }
];

export async function initDatabase() {
  try {
    const conn = await pool.getConnection();
    console.log('[CampusPrice DB] MySQL connected successfully.');

    // Create tables
    await conn.query(`
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
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS combos (
        combo_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        combo_items JSON NOT NULL,
        discount_pct DECIMAL(5, 2) NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS guardrails (
        id INT PRIMARY KEY DEFAULT 1,
        margin_floor_pct DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
        max_weekly_change_pct DECIMAL(5, 2) NOT NULL DEFAULT 15.00,
        student_price_cap DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
        coverage_target DECIMAL(5, 4) NOT NULL DEFAULT 0.7500,
        combo_discount_cap_pct DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
        fairness_mode BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS override_logs (
        override_id VARCHAR(50) PRIMARY KEY,
        rec_id VARCHAR(50) NOT NULL,
        decision ENUM('approve', 'edit', 'reject') NOT NULL,
        edited_value DECIMAL(10, 2) NULL,
        note TEXT NULL,
        decided_by VARCHAR(50) NOT NULL DEFAULT 'cafeteria_owner',
        decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed guardrails if not present
    const [gRows] = await conn.query('SELECT id FROM guardrails WHERE id = 1');
    if (gRows.length === 0) {
      await conn.query(`
        INSERT INTO guardrails (id, margin_floor_pct, max_weekly_change_pct, student_price_cap, coverage_target, combo_discount_cap_pct, fairness_mode)
        VALUES (1, 20.00, 15.00, 100.00, 0.7500, 20.00, TRUE)
      `);
    }

    // Seed menu items if empty
    const [itemRows] = await conn.query('SELECT item_id FROM menu_items LIMIT 1');
    if (itemRows.length === 0) {
      console.log('[CampusPrice DB] Seeding initial menu items...');
      for (const item of SEED_ITEMS) {
        await conn.query(
          `INSERT INTO menu_items (item_id, name, kind, price, cost, portion_size_g, units_per_day, flags, portion_tiers)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [item.item_id, item.name, item.kind, item.price, item.cost, item.portion_size_g, item.units_per_day, item.flags, item.portion_tiers]
        );
      }
    }

    // Seed combos if empty
    const [cRows] = await conn.query('SELECT combo_id FROM combos LIMIT 1');
    if (cRows.length === 0) {
      console.log('[CampusPrice DB] Seeding initial combos...');
      for (const combo of SEED_COMBOS) {
        await conn.query(
          `INSERT INTO combos (combo_id, name, combo_items, discount_pct, active)
           VALUES (?, ?, ?, ?, ?)`,
          [combo.combo_id, combo.name, combo.combo_items, combo.discount_pct, combo.active]
        );
      }
    }

    conn.release();
    console.log('[CampusPrice DB] Initial database setup & verify completed.');
  } catch (err) {
    console.warn('[CampusPrice DB] Note: MySQL connection not active or table setup pending:', err.message);
    console.warn('[CampusPrice DB] Falling back to high-fidelity seed store for offline/standalone execution.');
  }
}
