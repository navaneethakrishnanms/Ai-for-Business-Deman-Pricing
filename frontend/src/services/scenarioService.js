import { apiClient, requestWithFallback } from './api';
import { mockBackend } from './mockBackend';
import { API_ROUTES } from '../constants/apiRoutes';

export const scenarioService = {
  // Part C: POST /scenarios/compare
  async compareScenarios({ scenarios, day_type_mix }) {
    return requestWithFallback(
      () => apiClient.post(API_ROUTES.SCENARIOS_COMPARE, { scenarios, day_type_mix }),
      () => mockBackend.compareScenarios({ scenarios, day_type_mix })
    );
  }
};

