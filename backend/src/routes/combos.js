import express from 'express';
import { requireOwnerAuth } from '../middleware/security.js';
import { evaluateCombo, getComboSuggestions } from '../services/aiClient.js';

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
 * Calls AI Service Layer 2 engine to get all computed best discount combos
 */
router.get('/suggestions', requireOwnerAuth, async (req, res, next) => {
  try {
    const data = await getComboSuggestions();
    res.apiSuccess(data);
  } catch (error) {
    next(error);
  }
});

export default router;
