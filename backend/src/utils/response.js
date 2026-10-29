import crypto from 'crypto';
import { config } from '../config/index.js';

/**
 * Standard API Response Wrapper conforming to CampusPrice API Contract
 * Every response wraps payload as data plus meta.
 * 
 * @param {object|array} data - The payload
 * @param {object} [customMeta={}] - Additional meta overrides
 * @returns {object} { data, meta }
 */
export function formatResponse(data, customMeta = {}) {
  return {
    data,
    meta: {
      model_version: customMeta.model_version || config.modelVersion,
      data_source: customMeta.data_source || config.dataSource,
      generated_at: new Date().toISOString(),
      request_id: customMeta.request_id || crypto.randomUUID()
    }
  };
}

/**
 * Express middleware helper to attach res.apiSuccess and res.apiError
 */
export function responseHandler(req, res, next) {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', requestId);

  res.apiSuccess = function(data, statusCode = 200, customMeta = {}) {
    return res.status(statusCode).json(formatResponse(data, { ...customMeta, request_id: requestId }));
  };

  res.apiError = function(message, statusCode = 400, details = null) {
    return res.status(statusCode).json({
      error: {
        message,
        details,
        status_code: statusCode
      },
      meta: {
        model_version: config.modelVersion,
        data_source: config.dataSource,
        generated_at: new Date().toISOString(),
        request_id: requestId
      }
    });
  };

  next();
}

/**
 * Format numeric helper for money: float with 2 decimal places
 */
export function roundMoney(val) {
  return typeof val === 'number' ? Math.round(val * 100) / 100 : 0.0;
}

/**
 * Format range object: { mean, p10, p90 }
 */
export function formatRange(mean, p10, p90) {
  return {
    mean: Math.round(mean * 100) / 100,
    p10: Math.round(p10 * 100) / 100,
    p90: Math.round(p90 * 100) / 100
  };
}
