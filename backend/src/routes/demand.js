import express from 'express';
import { requireOwnerAuth } from '../middleware/security.js';
import { predictDemand } from '../services/aiClient.js';

const router = express.Router();

/**
 * POST /api/predict (Part B: Demand Lab)
 * Calculates predicted demand, revenue, profit ranges, and response curves
 */
router.post('/predict', requireOwnerAuth, async (req, res, next) => {
  try {
    const { item_id, price, portion_size_g, discount_pct = 0, day_type = 'regular' } = req.body;

    if (!item_id || price === undefined || portion_size_g === undefined) {
      return res.apiError('Missing required parameters: item_id, price, portion_size_g', 400);
    }

    const prediction = await predictDemand({
      item_id,
      price: parseFloat(price),
      portion_size_g: parseInt(portion_size_g, 10),
      discount_pct: parseFloat(discount_pct),
      day_type
    });

    res.apiSuccess(prediction);
  } catch (error) {
    next(error);
  }
});

export default router;
