import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Issues an Owner Session Token (JWT)
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Simple secure owner credentials check for cafeteria owner
  // In production, integrate bcrypt hash comparison against database admin record
  const defaultOwnerUser = process.env.OWNER_USERNAME || 'owner';
  const defaultOwnerPass = process.env.OWNER_PASSWORD || 'campusprice2026';

  if (username === defaultOwnerUser && password === defaultOwnerPass) {
    const token = jwt.sign(
      { id: 'owner_1', username, role: 'owner' },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    return res.apiSuccess({
      token,
      token_type: 'Bearer',
      expires_in: 86400,
      user: { username, role: 'owner' }
    });
  }

  return res.apiError('Invalid username or password', 401);
});

export default router;
