import { apiClient, requestWithFallback } from './api';
import { mockBackend } from './mockBackend';
import { API_ROUTES } from '../constants/apiRoutes';

export const modelService = {
  // Part H: GET /model/status
  async getModelStatus() {
    return requestWithFallback(
      () => apiClient.get(API_ROUTES.MODEL_STATUS),
      () => mockBackend.getModelStatus()
    );
  }
};

