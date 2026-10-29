import { apiClient, requestWithFallback } from './api';
import { mockBackend } from './mockBackend';
import { API_ROUTES } from '../constants/apiRoutes';

export const comboService = {
  // Part D: POST /combos/evaluate
  async evaluateCombo({ main_item_id, addon_item_id, discount_pct, day_type }) {
    return requestWithFallback(
      () => apiClient.post(API_ROUTES.COMBOS_EVALUATE, { main_item_id, addon_item_id, discount_pct, day_type }),
      () => mockBackend.evaluateCombo({ main_item_id, addon_item_id, discount_pct, day_type })
    );
  },

  // Part D: GET /combos/suggestions
  async getComboSuggestions() {
    return requestWithFallback(
      () => apiClient.get(API_ROUTES.COMBOS_SUGGESTIONS),
      () => mockBackend.getComboSuggestions()
    );
  }
};

