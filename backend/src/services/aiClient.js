import axios from 'axios';
import { config } from '../config/index.js';

export const aiClient = axios.create({
  baseURL: config.aiServiceUrl || 'http://localhost:8001',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer demo-owner-token'
  }
});

/**
 * Predict Demand & Profit for changed item (Part B: Demand Lab)
 */
export async function predictDemand(payload) {
  const res = await aiClient.post('/predict', payload);
  return res.data?.data || res.data;
}

/**
 * Compare Scenarios (Part C: Scenario Compare)
 */
export async function compareScenarios(payload) {
  const res = await aiClient.post('/scenarios/compare', payload);
  return res.data?.data || res.data;
}

/**
 * Evaluate Combo (Part D: Combo Studio)
 */
export async function evaluateCombo(payload) {
  const res = await aiClient.post('/combos/evaluate', payload);
  return res.data?.data || res.data;
}

/**
 * Get Combo Suggestions (Part D: Combo Studio Suggestions)
 */
export async function getComboSuggestions() {
  const res = await aiClient.get('/combos/suggestions');
  return res.data?.data || res.data;
}

/**
 * Get Recommendations (Part E: Recommendations)
 */
export async function getRecommendations(payload = {}) {
  const res = await aiClient.post('/recommend', payload);
  return res.data?.data || res.data;
}

/**
 * Query Assistant (Part G: Natural Language Assistant)
 */
export async function queryAssistant(payload) {
  const body = {
    text: payload.text || payload.query || '',
    context: payload.context || {}
  };
  const res = await aiClient.post('/assistant/query', body);
  return res.data?.data || res.data;
}

/**
 * Get Model Status (Part H: Model Status & Scorecard)
 */
export async function getModelStatus() {
  const res = await aiClient.get('/model/status');
  return res.data?.data || res.data;
}

/**
 * Get Student Offers (Part F: Student Budget Builder)
 */
export async function getStudentOffers(budget) {
  const res = await aiClient.get(`/student/offers?budget=${budget}`);
  return res.data?.data || res.data;
}
