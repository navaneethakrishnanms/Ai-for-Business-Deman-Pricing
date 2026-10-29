import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Proxy helpers for AI Service calls
export async function getDemandPrediction(params) {
  const response = await aiClient.post('/predict', params);
  return response.data;
}

export async function evaluateCombo(params) {
  const response = await aiClient.post('/evaluate-combo', params);
  return response.data;
}

export async function optimizeFrontier(params) {
  const response = await aiClient.post('/optimize', params);
  return response.data;
}

export async function getRecommendations(params) {
  const response = await aiClient.post('/recommend', params);
  return response.data;
}
