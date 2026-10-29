import { apiClient, requestApi } from './api';
import { API_ROUTES } from '../constants/apiRoutes';

export const demandService = {
  // Part B: POST /predict
  async predict({ item_id, price, portion_size_g, discount_pct = 0, day_type = 'regular' }) {
    return requestApi(() => 
      apiClient.post(API_ROUTES.PREDICT, { item_id, price, portion_size_g, discount_pct, day_type })
    );
  }
};
