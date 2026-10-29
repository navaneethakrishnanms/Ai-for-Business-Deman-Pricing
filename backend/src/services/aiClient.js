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
 * Item ID translation maps between backend DB IDs and AI service CSV IDs.
 * Backend DB uses prefixed IDs (item_biryani, item_dosa, addon_cold_coffee).
 * AI service CSV uses short IDs (chicken_biryani, dosa, cold_coffee).
 */
const BACKEND_TO_AI_ID = {
  // Mains
  'item_biryani':    'chicken_biryani',
  'item_dosa':       'dosa',
  'item_paneer_roll':'paneer_roll',
  'item_veg_meals':  'veg_meals',
  'item_salad':      'salad_bowl',
  // Addons
  'addon_cold_coffee': 'cold_coffee',
  'item_cold_coffee':  'cold_coffee',
  'addon_fresh_juice': 'fresh_juice',
  'item_fresh_juice':  'fresh_juice',
  'addon_chai':        'tea',
  'item_tea':          'tea',
  'item_samosa':       'samosa',
  // Combos
  'combo_biryani_juice': 'combo_bir_juice',
  'combo_dosa_coffee':   'combo_dosa_cc',
  'combo_meals_tea':     'combo_veg_tea',
  'combo_veg_tea':       'combo_veg_tea',
};

const AI_TO_BACKEND_ID = Object.fromEntries(
  Object.entries(BACKEND_TO_AI_ID).map(([k, v]) => [v, k])
);

/**
 * Translate a single backend item_id to AI service item_id.
 * Falls back to original if no mapping found.
 */
function toAiId(backendId) {
  return BACKEND_TO_AI_ID[backendId] || backendId;
}

/**
 * Translate a single AI service item_id back to backend item_id.
 */
function toBackendId(aiId) {
  return AI_TO_BACKEND_ID[aiId] || aiId;
}

/**
 * Translate all item_id fields in a nested result object back to backend IDs.
 */
function translateResultIds(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(translateResultIds);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'item_id' || k === 'main_item_id' || k === 'addon_item_id') {
      out[k] = toBackendId(v);
    } else if (typeof v === 'object') {
      out[k] = translateResultIds(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Predict Demand & Profit for changed item (Part B: Demand Lab)
 */
export async function predictDemand(payload) {
  const aiPayload = {
    ...payload,
    item_id: toAiId(payload.item_id)
  };
  const res = await aiClient.post('/predict', aiPayload);
  const data = res.data?.data || res.data;
  return translateResultIds(data);
}

/**
 * Compare Scenarios (Part C: Scenario Compare)
 */
export async function compareScenarios(payload) {
  // Translate all item_ids inside scenario item_changes
  const aiPayload = {
    ...payload,
    scenarios: (payload.scenarios || []).map(sc => ({
      ...sc,
      item_changes: (sc.item_changes || []).map(ic => ({
        ...ic,
        item_id: toAiId(ic.item_id)
      })),
      combo_changes: (sc.combo_changes || []).map(cc => ({
        ...cc,
        combo_id: toAiId(cc.combo_id)
      }))
    }))
  };
  const res = await aiClient.post('/scenarios/compare', aiPayload);
  const data = res.data?.data || res.data;
  return translateResultIds(data);
}

/**
 * Evaluate Combo (Part D: Combo Studio)
 */
export async function evaluateCombo(payload) {
  const aiPayload = {
    ...payload,
    main_item_id: toAiId(payload.main_item_id),
    addon_item_id: toAiId(payload.addon_item_id)
  };
  const res = await aiClient.post('/combos/evaluate', aiPayload);
  const data = res.data?.data || res.data;
  return translateResultIds(data);
}

/**
 * Get Combo Suggestions (Part D: Combo Studio Suggestions)
 */
export async function getComboSuggestions() {
  const res = await aiClient.get('/combos/suggestions');
  const data = res.data?.data || res.data;
  return translateResultIds(data);
}

/**
 * Get Recommendations (Part E: Recommendations)
 */
export async function getRecommendations(payload = {}) {
  const res = await aiClient.post('/recommend', payload);
  const data = res.data?.data || res.data;
  return translateResultIds(data);
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
