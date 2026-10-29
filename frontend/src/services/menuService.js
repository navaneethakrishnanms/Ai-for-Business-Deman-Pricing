import { apiClient, requestApi } from './api';
import { API_ROUTES } from '../constants/apiRoutes';

export const menuService = {
  // Part A: GET /items
  async getItems() {
    return requestApi(() => apiClient.get(API_ROUTES.ITEMS));
  }
};
