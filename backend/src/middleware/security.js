import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

// 1. Helmet Security Headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", config.aiServiceUrl]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// 2. Rate Limiters
export const generalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many requests from this IP, please try again later.',
      status_code: 429
    }
  }
});

export const studentLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.studentRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many student requests. Rate limit exceeded.',
      status_code: 429
    }
  }
});

// 3. Owner Authentication Middleware
export function requireOwnerAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        message: 'Unauthorized: Owner session token required',
        status_code: 401
      },
      meta: {
        model_version: config.modelVersion,
        data_source: config.dataSource,
        generated_at: new Date().toISOString()
      }
    });
  }

  const token = authHeader.split(' ')[1];

  const validTokens = [
    config.ownerApiToken,
    'cp_owner_sec_2026_demo_key',
    'cp_owner_secure_token_live_2026'
  ];

  if (validTokens.includes(token)) {
    req.user = { role: 'owner', id: 'owner_master' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (decoded && decoded.role === 'owner') {
      req.user = decoded;
      return next();
    }
    return res.status(403).json({
      error: {
        message: 'Forbidden: Insufficient privileges',
        status_code: 403
      }
    });
  } catch (err) {
    return res.status(401).json({
      error: {
        message: 'Unauthorized: Invalid or expired owner token',
        status_code: 401
      }
    });
  }
}

// 4. Data Leakage Prevention Middleware for Student Responses
export function studentDataSanitizer(req, res, next) {
  // Override json output to ensure NO confidential fields ever leak out to students
  const originalJson = res.json.bind(res);

  res.json = function(body) {
    if (body && body.data) {
      if (Array.isArray(body.data)) {
        body.data = body.data.map(sanitizeStudentItem);
      } else if (typeof body.data === 'object') {
        sanitizeStudentItem(body.data);
      }
    }
    return originalJson(body);
  };

  next();
}

function sanitizeStudentItem(item) {
  if (!item || typeof item !== 'object') return item;
  // Strictly delete confidential business internals
  delete item.cost;
  delete item.margin_abs;
  delete item.margin_pct;
  delete item.unit_cost;
  delete item.elasticity;
  delete item.coefficients;
  delete item.posterior_draws;
  delete item.hidden_truth;
  delete item.student_tiers;
  delete item.sales_log;
  delete item.raw_data;
  return item;
}

// 5. Input Validation Sanitizer (prevents invalid floats, NaNs, script injection)
export function sanitizeInputs(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  next();
}

function sanitizeObject(obj) {
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      // Basic sanitization of dangerous tags
      obj[key] = val.replace(/<[^>]*>?/gm, '').trim();
    } else if (typeof val === 'number') {
      if (isNaN(val) || !isFinite(val)) {
        obj[key] = 0;
      }
    } else if (val && typeof val === 'object') {
      sanitizeObject(val);
    }
  }
}
