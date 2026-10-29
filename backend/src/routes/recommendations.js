import express from 'express';
import crypto from 'crypto';
import { requireOwnerAuth } from '../middleware/security.js';
import { getRecommendations } from '../services/aiClient.js';
import { query, withTransaction } from '../db/index.js';

const router = express.Router();

// Fallback in-memory overrides store
const memoryOverrides = [];

/**
 * POST /api/recommend (Part E: Recommendations)
 * Runs multi-objective optimizer respecting owner guardrails
 */
router.post('/recommend', requireOwnerAuth, async (req, res, next) => {
  try {
    const { coverage_target, day_type_mix, include_frontier = false } = req.body;

    const result = await getRecommendations({
      coverage_target,
      day_type_mix,
      include_frontier: Boolean(include_frontier)
    });

    res.apiSuccess(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/overrides (Part E: Overrides Submission via Transaction)
 * Records the owner's decision on a recommendation
 */
router.post('/overrides', requireOwnerAuth, async (req, res, next) => {
  try {
    const { rec_id, decision, edited_value, note } = req.body;

    if (!rec_id || !decision) {
      return res.apiError('rec_id and decision (approve, edit, reject) are required', 400);
    }

    if (!['approve', 'edit', 'reject'].includes(decision)) {
      return res.apiError('decision must be one of: approve, edit, reject', 400);
    }

    const overrideId = 'ovr_' + crypto.randomBytes(6).toString('hex');
    const decidedAt = new Date().toISOString();
    const decidedBy = req.user?.username || 'cafeteria_owner';

    try {
      // Transaction-based execution
      await withTransaction(async (conn) => {
        await conn.execute(
          `INSERT INTO override_logs (override_id, rec_id, decision, edited_value, note, decided_by, decided_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            overrideId,
            rec_id,
            decision,
            edited_value !== undefined ? parseFloat(edited_value) : null,
            note || null,
            decidedBy,
            new Date()
          ]
        );
      });
    } catch (dbErr) {
      // Memory fallback if DB offline
      memoryOverrides.unshift({
        override_id: overrideId,
        rec_id,
        decision,
        edited_value: edited_value !== undefined ? parseFloat(edited_value) : null,
        note: note || null,
        decided_by: decidedBy,
        decided_at: decidedAt
      });
    }

    res.apiSuccess({
      override_id: overrideId,
      status: 'recorded',
      decided_at: decidedAt
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/overrides (Part E: Override Log History)
 */
router.get('/overrides', requireOwnerAuth, async (req, res, next) => {
  try {
    try {
      const [rows] = await query('SELECT * FROM override_logs ORDER BY decided_at DESC LIMIT 50');
      return res.apiSuccess(rows);
    } catch (e) {
      return res.apiSuccess(memoryOverrides);
    }
  } catch (error) {
    next(error);
  }
});

export default router;
