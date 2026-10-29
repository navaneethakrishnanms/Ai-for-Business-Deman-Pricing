import { apiClient, requestApi } from './api';
import { API_ROUTES } from '../constants/apiRoutes';

export const recommendService = {
  // Part E: POST /recommend
  async getRecommendations({ coverage_target, day_type_mix, include_frontier = true }) {
    return requestApi(() => 
      apiClient.post(API_ROUTES.RECOMMEND, { coverage_target, day_type_mix, include_frontier })
    );
  },

  // Part E: POST /overrides
  async submitOverride({ rec_id, decision, edited_value, note }) {
    return requestApi(() => 
      apiClient.post(API_ROUTES.OVERRIDES, { rec_id, decision, edited_value, note })
    );
  },

  // Part E: GET /overrides
  async getOverrides() {
    return requestApi(() => apiClient.get(API_ROUTES.OVERRIDES));
  }
};
