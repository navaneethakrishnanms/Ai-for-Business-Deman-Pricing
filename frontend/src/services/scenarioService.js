import { apiClient, requestApi } from './api';
import { API_ROUTES } from '../constants/apiRoutes';

export const scenarioService = {
  // Part C: POST /scenarios/compare
  async compareScenarios({ scenarios, day_type_mix }) {
    return requestApi(() => 
      apiClient.post(API_ROUTES.SCENARIOS_COMPARE, { scenarios, day_type_mix })
    );
  }
};
