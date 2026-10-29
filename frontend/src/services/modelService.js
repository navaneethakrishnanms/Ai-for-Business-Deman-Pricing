import { apiClient, requestApi } from './api';
import { API_ROUTES } from '../constants/apiRoutes';

export const modelService = {
  // Part H: GET /model/status
  async getModelStatus() {
    return requestApi(() => apiClient.get(API_ROUTES.MODEL_STATUS));
  }
};
