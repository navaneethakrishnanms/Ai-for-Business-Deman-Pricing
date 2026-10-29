import { apiClient, requestApi } from './api';
import { API_ROUTES } from '../constants/apiRoutes';

export const assistantService = {
  // Part G: POST /assistant/query
  async queryAssistant(queryText, currentContext = {}) {
    return requestApi(() => 
      apiClient.post(API_ROUTES.ASSISTANT_QUERY, { query: queryText, context: currentContext })
    );
  }
};
