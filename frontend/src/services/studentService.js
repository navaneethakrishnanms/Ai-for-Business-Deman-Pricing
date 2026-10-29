import { apiClient, requestWithFallback } from './api';
import { mockBackend } from './mockBackend';
import { API_ROUTES } from '../constants/apiRoutes';

export const studentService = {
  // Part F: GET /student/offers
  async getStudentOffers(budget) {
    return requestWithFallback(
      () => apiClient.get(`${API_ROUTES.STUDENT_OFFERS}?budget=${budget}`),
      () => mockBackend.getStudentOffers(budget)
    );
  }
};

