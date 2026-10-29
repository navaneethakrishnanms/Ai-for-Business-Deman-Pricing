import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CampusPrice Backend API Gateway (JavaScript)',
    timestamp: new Date().toISOString(),
    aiServiceUrl: AI_SERVICE_URL
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`[CampusPrice Backend] Running on http://localhost:${PORT}`);
  console.log(`[CampusPrice Backend] Configured AI Service: ${AI_SERVICE_URL}`);
});
