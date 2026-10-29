import { apiClient, requestWithFallback } from './api';
import { mockBackend } from './mockBackend';
import { API_ROUTES } from '../constants/apiRoutes';

export const assistantService = {
  // Part G: POST /assistant/query
  async queryAssistant(queryText, currentContext = {}) {
    return requestWithFallback(
      () => apiClient.post(API_ROUTES.ASSISTANT_QUERY, { query: queryText, context: currentContext }),
      () => mockBackend.queryAssistant(queryText)
    );
  }
};

