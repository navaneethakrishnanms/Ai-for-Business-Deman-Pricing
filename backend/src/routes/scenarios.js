import express from 'express';
import { requireOwnerAuth } from '../middleware/security.js';
import { compareScenarios } from '../services/aiClient.js';

const router = express.Router();

/**
 * POST /api/scenarios/compare (Part C: Scenario Compare)
 * Compares Today baseline against up to 4 user/AI scenarios
 */
router.post('/compare', requireOwnerAuth, async (req, res, next) => {
  try {
    const { scenarios = [], day_type_mix } = req.body;

    if (!Array.isArray(scenarios)) {
      return res.apiError('scenarios must be an array', 400);
    }

    if (scenarios.length > 4) {
      return res.apiError('Maximum 4 scenarios can be compared at once', 400);
    }

    const comparison = await compareScenarios({
      scenarios,
      day_type_mix
    });

    res.apiSuccess(comparison);
  } catch (error) {
    next(error);
  }
});

export default router;
