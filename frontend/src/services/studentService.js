import { apiClient, requestApi } from './api';
import { API_ROUTES } from '../constants/apiRoutes';

export const studentService = {
  // Part F: GET /student/offers
  async getStudentOffers(budget) {
    return requestApi(() => 
      apiClient.get(`${API_ROUTES.STUDENT_OFFERS}?budget=${budget}`)
    );
  }
};
