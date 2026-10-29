import { apiClient, requestWithFallback } from './api';
import { mockBackend } from './mockBackend';
import { API_ROUTES } from '../constants/apiRoutes';

export const guardrailsService = {
  // Part A: GET /config
  async getConfig() {
    return requestWithFallback(
      () => apiClient.get(API_ROUTES.CONFIG),
      () => mockBackend.getConfig()
    );
  },

  // Part A: PUT /config
  async updateConfig(newConfig) {
    return requestWithFallback(
      () => apiClient.put(API_ROUTES.CONFIG, newConfig),
      () => mockBackend.updateConfig(newConfig)
    );
  }
};

