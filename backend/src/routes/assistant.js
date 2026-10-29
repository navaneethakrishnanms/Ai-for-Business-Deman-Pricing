import express from 'express';
import { requireOwnerAuth } from '../middleware/security.js';
import { queryAssistant, getModelStatus } from '../services/aiClient.js';

const router = express.Router();

/**
 * POST /api/assistant/query (Part G: Natural-Language What-If Assistant)
 * Calls AI Service LLM / heuristic explainer
 */
router.post('/query', requireOwnerAuth, async (req, res, next) => {
  try {
    const userQuery = req.body.query || req.body.text;
    const context = req.body.context || {};

    if (!userQuery) {
      return res.apiError('query or text is required', 400);
    }

    const aiResponse = await queryAssistant({ query: userQuery, context });
    
    // Normalize fields for frontend UI
    const explanation = aiResponse.explanation || aiResponse.answer || '';
    const suggested_scenario = aiResponse.suggested_scenario || null;
    const confidence = aiResponse.confidence || 0.9;
    const citations = aiResponse.citations || [];

    res.apiSuccess({
      query: userQuery,
      answer: explanation,
      explanation,
      suggested_scenario,
      confidence,
      citations
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/model/status (Part H: Model Status and Validation)
 * Returns status, version, training date, and scorecard from AI Service
 */
router.get('/status', requireOwnerAuth, async (req, res, next) => {
  try {
    const statusData = await getModelStatus();
    res.apiSuccess(statusData);
  } catch (error) {
    next(error);
  }
});

export default router;
