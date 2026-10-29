import { apiClient, requestApi } from './api';
import { API_ROUTES } from '../constants/apiRoutes';

export const guardrailsService = {
  // Part A: GET /config
  async getConfig() {
    return requestApi(() => apiClient.get(API_ROUTES.CONFIG));
  },

  // Part A: PUT /config
  async updateConfig(newConfig) {
    return requestApi(() => apiClient.put(API_ROUTES.CONFIG, newConfig));
  }
};
