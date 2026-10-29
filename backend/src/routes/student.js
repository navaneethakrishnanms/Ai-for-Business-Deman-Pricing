import express from 'express';
import { studentLimiter, studentDataSanitizer } from '../middleware/security.js';
import { query } from '../db/index.js';
import { getStudentOffers } from '../services/aiClient.js';
import { SEED_ITEMS, SEED_COMBOS } from '../db/initDb.js';
import { roundMoney } from '../utils/response.js';

const router = express.Router();

/**
 * GET /api/student/offers (Part F: Student Budget Builder)
 * Public, read-only, rate-limited endpoint.
 * NO OWNER TOKEN NEEDED.
 * Strictly sanitizes output so unit cost, margins, and internals never leave server.
 */
router.get('/offers', studentLimiter, studentDataSanitizer, async (req, res, next) => {
  try {
    const rawBudget = req.query.budget;
    const budget = rawBudget ? parseFloat(rawBudget) : 100.0;

    let items = [];
    let combos = [];

    try {
      const [dbItems] = await query('SELECT * FROM menu_items ORDER BY price ASC');
      const [dbCombos] = await query('SELECT * FROM combos WHERE active = 1');
      items = dbItems;
      combos = dbCombos;
    } catch (e) {
      items = SEED_ITEMS;
      combos = SEED_COMBOS;
    }

    // Process student-safe items (stripping out cost and internal flags)
    const affordableItems = [];
    items.forEach(item => {
      const price = parseFloat(item.price);
      const portion_size_g = parseInt(item.portion_size_g, 10);
      const price_per_100g = portion_size_g > 0 ? roundMoney((price / portion_size_g) * 100) : 0;

      // Regular item within budget
      if (price <= budget) {
        affordableItems.push({
          type: 'single_item',
          item_id: item.item_id,
          name: item.name,
          kind: item.kind,
          price,
          portion_size_g,
          price_per_100g,
          tier: 'regular'
        });
      }

      // Check portion ladder tiers (e.g. half plate) for tight budget students
      let portionTiers = [];
      try {
        portionTiers = typeof item.portion_tiers === 'string' ? JSON.parse(item.portion_tiers) : (item.portion_tiers || []);
      } catch (err) {
        portionTiers = [];
      }

      portionTiers.forEach(pt => {
        if (pt.tier !== 'regular' && pt.price <= budget) {
          affordableItems.push({
            type: 'portion_tier',
            item_id: item.item_id,
            name: `${item.name} (${pt.tier})`,
            kind: item.kind,
            price: parseFloat(pt.price),
            portion_size_g: parseInt(pt.portion_size_g, 10),
            price_per_100g: pt.portion_size_g > 0 ? roundMoney((pt.price / pt.portion_size_g) * 100) : 0,
            tier: pt.tier
          });
        }
      });
    });

    // Process affordable student combos
    const itemMap = new Map(items.map(i => [i.item_id, i]));
    const affordableCombos = [];

    combos.forEach(combo => {
      let comboItems = [];
      try {
        comboItems = typeof combo.combo_items === 'string' ? JSON.parse(combo.combo_items) : (combo.combo_items || []);
      } catch (err) {
        comboItems = [];
      }

      const resolvedItems = comboItems.map(id => itemMap.get(id)).filter(Boolean);
      if (resolvedItems.length === 2) {
        const fullPrice = resolvedItems.reduce((sum, it) => sum + parseFloat(it.price), 0);
        const discount_pct = parseFloat(combo.discount_pct);
        const comboPrice = roundMoney(fullPrice * (1 - discount_pct / 100));
        const savings_rs = roundMoney(fullPrice - comboPrice);
        const totalPortion = resolvedItems.reduce((sum, it) => sum + parseInt(it.portion_size_g, 10), 0);

        if (comboPrice <= budget) {
          affordableCombos.push({
            type: 'combo_deal',
            combo_id: combo.combo_id,
            name: combo.name,
            items: resolvedItems.map(i => i.name),
            combo_price: comboPrice,
            original_price: fullPrice,
            savings_rs,
            discount_pct,
            portion_size_g: totalPortion,
            price_per_100g: totalPortion > 0 ? roundMoney((comboPrice / totalPortion) * 100) : 0
          });
        }
      }
    });

    try {
      const aiData = await getStudentOffers(budget);
      if (aiData && aiData.offers && aiData.offers.length > 0) {
        aiData.offers.forEach(o => {
          if (!affordableCombos.some(c => c.combo_id === o.offer_id)) {
            affordableCombos.push({
              type: 'combo_deal',
              combo_id: o.offer_id,
              name: o.title,
              items: o.items,
              combo_price: o.price,
              original_price: o.list_price,
              savings_rs: o.you_save,
              discount_pct: o.list_price > 0 ? roundMoney(((o.list_price - o.price) / o.list_price) * 100) : 0,
              portion_size_g: 500,
              price_per_100g: o.price_per_100g
            });
          }
        });
      }
    } catch (aiErr) {
      // Keep DB combos if AI service is starting
    }

    // Rank deals by best value (lowest price per 100g first)
    affordableItems.sort((a, b) => a.price_per_100g - b.price_per_100g);
    affordableCombos.sort((a, b) => b.savings_rs - a.savings_rs);

    res.apiSuccess({
      budget,
      single_items: affordableItems,
      combos: affordableCombos,
      student_offers: {
        combos: affordableCombos,
        items: affordableItems
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
