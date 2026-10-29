import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  jwtSecret: process.env.JWT_SECRET || 'campusprice_default_secret_dev_2026',
  ownerApiToken: process.env.OWNER_API_TOKEN || 'cp_owner_secure_token_live_2026',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 120,
  studentRateLimitMax: Number(process.env.STUDENT_RATE_LIMIT_MAX) || 60,
  modelVersion: '1.0.0',
  dataSource: 'synthetic'
};
