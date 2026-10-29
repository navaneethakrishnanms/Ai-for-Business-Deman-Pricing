import { apiClient, requestWithFallback } from './api';
import { mockBackend } from './mockBackend';
import { API_ROUTES } from '../constants/apiRoutes';

export const menuService = {
  // Part A: GET /items
  async getItems() {
    return requestWithFallback(
      () => apiClient.get(API_ROUTES.ITEMS),
      () => mockBackend.getItems()
    );
  }
};

