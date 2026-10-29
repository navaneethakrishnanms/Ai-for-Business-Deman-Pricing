import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { config } from './config/index.js';
import { 
  securityHeaders, 
  generalLimiter, 
  sanitizeInputs 
} from './middleware/security.js';
import { responseHandler } from './utils/response.js';
import { initDatabase } from './db/initDb.js';

// Route Imports
import authRouter from './routes/auth.js';
import menuRouter from './routes/menu.js';
import demandRouter from './routes/demand.js';
import scenariosRouter from './routes/scenarios.js';
import combosRouter from './routes/combos.js';
import recommendationsRouter from './routes/recommendations.js';
import studentRouter from './routes/student.js';
import assistantRouter from './routes/assistant.js';

dotenv.config();

const app = express();

// 1. Security & Protection Middlewares
app.use(securityHeaders);
app.use(generalLimiter);
app.use(cors({
  origin: [config.clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
}));
app.use(express.json({ limit: '1mb' }));
app.use(sanitizeInputs);
app.use(responseHandler);

// 2. Health & Diagnostics
app.get('/api/health', (req, res) => {
  res.apiSuccess({
    status: 'healthy',
    service: 'CampusPrice Backend API Gateway',
    environment: config.nodeEnv,
    database: 'MySQL2 (Promise Pool & Transactions)',
    ai_service_url: config.aiServiceUrl
  });
});

// 3. API Contract Route Registrations
app.use('/api/auth', authRouter);
app.use('/api', menuRouter);                        // GET /items, GET /config, PUT /config
app.use('/api', demandRouter);                      // POST /predict
app.use('/api/scenarios', scenariosRouter);          // POST /scenarios/compare
app.use('/api/combos', combosRouter);                // POST /combos/evaluate, GET /combos/suggestions
app.use('/api', recommendationsRouter);             // POST /recommend, POST /overrides, GET /overrides
app.use('/api/student', studentRouter);              // GET /student/offers (Public & Rate-limited)
app.use('/api/assistant', assistantRouter);          // POST /assistant/query
app.use('/api/model', assistantRouter);              // GET /model/status

// 4. Global 404 Handler
app.use((req, res) => {
  res.apiError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404);
});

// 5. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[CampusPrice Global Error]:', err);
  const status = err.status || 500;
  res.apiError(
    config.nodeEnv === 'production' ? 'Internal server error occurred' : err.message,
    status,
    config.nodeEnv === 'production' ? undefined : err.stack
  );
});

// 6. Start Server and Initialize Database
const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(config.port, HOST, async () => {
  console.log(`====================================================`);
  console.log(`[CampusPrice Backend] Server active at http://localhost:${config.port}`);
  console.log(`[CampusPrice Backend] Mode: ${config.nodeEnv}`);
  console.log(`[CampusPrice Backend] AI Service URL: ${config.aiServiceUrl}`);
  console.log(`====================================================`);
  
  // Initialize Database tables and seeds
  await initDatabase();
});

export default app;
