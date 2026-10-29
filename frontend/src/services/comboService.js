import { apiClient, requestApi } from './api';
import { API_ROUTES } from '../constants/apiRoutes';

export const comboService = {
  // Part D: POST /combos/evaluate
  async evaluateCombo({ main_item_id, addon_item_id, discount_pct = 12, day_type = 'regular' }) {
    return requestApi(() => 
      apiClient.post(API_ROUTES.COMBOS_EVALUATE, { main_item_id, addon_item_id, discount_pct, day_type })
    );
  },

  // Part D: GET /combos/suggestions
  async getComboSuggestions() {
    return requestApi(() => apiClient.get(API_ROUTES.COMBOS_SUGGESTIONS));
  }
};
