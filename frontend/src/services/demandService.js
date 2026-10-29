import { apiClient, requestWithFallback } from './api';
import { mockBackend } from './mockBackend';
import { API_ROUTES } from '../constants/apiRoutes';

export const demandService = {
  // Part B: POST /predict
  async predict({ item_id, price, portion_size_g, discount_pct = 0, day_type = 'regular' }) {
    return requestWithFallback(
      () => apiClient.post(API_ROUTES.PREDICT, { item_id, price, portion_size_g, discount_pct, day_type }),
      () => mockBackend.predict({ item_id, price, portion_size_g, discount_pct, day_type })
    );
  }
};

