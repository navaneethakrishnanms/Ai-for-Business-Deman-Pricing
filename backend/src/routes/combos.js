import express from 'express';
import { requireOwnerAuth } from '../middleware/security.js';
import { evaluateCombo } from '../services/aiClient.js';
import { formatRange } from '../utils/response.js';

const router = express.Router();

/**
 * POST /api/combos/evaluate (Part D: Combo Studio)
 * Evaluates main + addon pairing for cannibalisation, lift, and break-even take rate
 */
router.post('/evaluate', requireOwnerAuth, async (req, res, next) => {
  try {
    const { main_item_id, addon_item_id, discount_pct = 10, day_type = 'regular' } = req.body;

    if (!main_item_id || !addon_item_id) {
      return res.apiError('main_item_id and addon_item_id are required', 400);
    }

    const evaluation = await evaluateCombo({
      main_item_id,
      addon_item_id,
      discount_pct: parseFloat(discount_pct),
      day_type
    });

    res.apiSuccess(evaluation);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/combos/suggestions (Part D: Combo Studio Suggestions)
 * Returns pre-computed best pairings and discounts
 */
router.get('/suggestions', requireOwnerAuth, async (req, res, next) => {
  try {
    const suggestions = [
      {
        main_item_id: 'item_veg_meals',
        addon_item_id: 'item_tea',
        best_discount_pct: 10.0,
        incremental_profit_per_day: formatRange(450.0, 320.0, 580.0),
        status: 'apply'
      },
      {
        main_item_id: 'item_dosa',
        addon_item_id: 'item_tea',
        best_discount_pct: 8.0,
        incremental_profit_per_day: formatRange(380.0, 270.0, 490.0),
        status: 'apply'
      },
      {
        main_item_id: 'item_dosa',
        addon_item_id: 'item_cold_coffee',
        best_discount_pct: 12.0,
        incremental_profit_per_day: formatRange(-120.0, -240.0, -40.0),
        status: 'hold'
      },
      {
        main_item_id: 'item_biryani',
        addon_item_id: 'item_cold_coffee',
        best_discount_pct: 5.0,
        incremental_profit_per_day: formatRange(210.0, 110.0, 310.0),
        status: 'pilot'
      }
    ];

    res.apiSuccess({ suggestions });
  } catch (error) {
    next(error);
  }
});

export default router;
