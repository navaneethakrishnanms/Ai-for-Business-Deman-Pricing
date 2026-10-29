import express from 'express';
import { query, withTransaction } from '../db/index.js';
import { requireOwnerAuth } from '../middleware/security.js';
import { SEED_ITEMS, SEED_COMBOS } from '../db/initDb.js';
import { roundMoney } from '../utils/response.js';

const router = express.Router();

// Fallback in-memory guardrails if DB is offline
let memoryGuardrails = {
  margin_floor_pct: 20.0,
  max_weekly_change_pct: 15.0,
  student_price_cap: 100.0,
  coverage_target: 0.75,
  combo_discount_cap_pct: 20.0,
  fairness_mode: true
};

/**
 * GET /api/items (Part A: Menu Health)
 * Returns menu items with margins, flags, portion tiers, and current combos
 */
router.get('/items', requireOwnerAuth, async (req, res, next) => {
  try {
    let items = [];
    let combos = [];

    try {
      const [dbItems] = await query('SELECT * FROM menu_items ORDER BY kind, name');
      const [dbCombos] = await query('SELECT * FROM combos WHERE active = 1');
      items = dbItems;
      combos = dbCombos;
    } catch (dbErr) {
      // Offline fallback
      items = SEED_ITEMS;
      combos = SEED_COMBOS;
    }

    // Process items according to API Contract
    const processedItems = items.map(item => {
      const price = parseFloat(item.price);
      const cost = parseFloat(item.cost);
      const margin_abs = roundMoney(price - cost);
      const margin_pct = price > 0 ? roundMoney(((price - cost) / price) * 100) : 0;
      
      let flags = [];
      try {
        flags = typeof item.flags === 'string' ? JSON.parse(item.flags) : (item.flags || []);
      } catch (e) {
        flags = [];
      }

      let portion_tiers = [];
      try {
        portion_tiers = typeof item.portion_tiers === 'string' ? JSON.parse(item.portion_tiers) : (item.portion_tiers || []);
      } catch (e) {
        portion_tiers = [];
      }

      return {
        item_id: item.item_id,
        name: item.name,
        kind: item.kind,
        price,
        cost,
        portion_size_g: parseInt(item.portion_size_g, 10),
        units_per_day: parseFloat(item.units_per_day),
        margin_abs,
        margin_pct,
        flags,
        portion_tiers
      };
    });

    const processedCombos = combos.map(combo => {
      let combo_items = [];
      try {
        combo_items = typeof combo.combo_items === 'string' ? JSON.parse(combo.combo_items) : (combo.combo_items || []);
      } catch (e) {
        combo_items = [];
      }

      return {
        combo_id: combo.combo_id,
        name: combo.name,
        combo_items,
        discount_pct: parseFloat(combo.discount_pct)
      };
    });

    res.apiSuccess({
      items: processedItems,
      combos: processedCombos
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/config (Part A: Guardrails Settings)
 */
router.get('/config', requireOwnerAuth, async (req, res, next) => {
  try {
    try {
      const [rows] = await query('SELECT * FROM guardrails WHERE id = 1');
      if (rows.length > 0) {
        const g = rows[0];
        return res.apiSuccess({
          margin_floor_pct: parseFloat(g.margin_floor_pct),
          max_weekly_change_pct: parseFloat(g.max_weekly_change_pct),
          student_price_cap: parseFloat(g.student_price_cap),
          coverage_target: parseFloat(g.coverage_target),
          combo_discount_cap_pct: parseFloat(g.combo_discount_cap_pct),
          fairness_mode: Boolean(g.fairness_mode)
        });
      }
    } catch (e) {
      // Fallback
    }

    res.apiSuccess(memoryGuardrails);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/config (Part A: Edit Guardrails via Transaction)
 */
router.put('/config', requireOwnerAuth, async (req, res, next) => {
  const {
    margin_floor_pct,
    max_weekly_change_pct,
    student_price_cap,
    coverage_target,
    combo_discount_cap_pct,
    fairness_mode
  } = req.body;

  try {
    try {
      await withTransaction(async (conn) => {
        await conn.execute(
          `UPDATE guardrails SET
            margin_floor_pct = COALESCE(?, margin_floor_pct),
            max_weekly_change_pct = COALESCE(?, max_weekly_change_pct),
            student_price_cap = COALESCE(?, student_price_cap),
            coverage_target = COALESCE(?, coverage_target),
            combo_discount_cap_pct = COALESCE(?, combo_discount_cap_pct),
            fairness_mode = COALESCE(?, fairness_mode)
           WHERE id = 1`,
          [
            margin_floor_pct,
            max_weekly_change_pct,
            student_price_cap,
            coverage_target,
            combo_discount_cap_pct,
            fairness_mode !== undefined ? (fairness_mode ? 1 : 0) : null
          ]
        );
      });
    } catch (dbErr) {
      // Memory fallback
      memoryGuardrails = {
        ...memoryGuardrails,
        ...(margin_floor_pct !== undefined && { margin_floor_pct: parseFloat(margin_floor_pct) }),
        ...(max_weekly_change_pct !== undefined && { max_weekly_change_pct: parseFloat(max_weekly_change_pct) }),
        ...(student_price_cap !== undefined && { student_price_cap: parseFloat(student_price_cap) }),
        ...(coverage_target !== undefined && { coverage_target: parseFloat(coverage_target) }),
        ...(combo_discount_cap_pct !== undefined && { combo_discount_cap_pct: parseFloat(combo_discount_cap_pct) }),
        ...(fairness_mode !== undefined && { fairness_mode: Boolean(fairness_mode) })
      };
    }

    try {
      const [rows] = await query('SELECT * FROM guardrails WHERE id = 1');
      if (rows.length > 0) {
        const g = rows[0];
        return res.apiSuccess({
          margin_floor_pct: parseFloat(g.margin_floor_pct),
          max_weekly_change_pct: parseFloat(g.max_weekly_change_pct),
          student_price_cap: parseFloat(g.student_price_cap),
          coverage_target: parseFloat(g.coverage_target),
          combo_discount_cap_pct: parseFloat(g.combo_discount_cap_pct),
          fairness_mode: Boolean(g.fairness_mode)
        });
      }
    } catch (e) {}

    res.apiSuccess(memoryGuardrails);
  } catch (error) {
    next(error);
  }
});

export default router;
