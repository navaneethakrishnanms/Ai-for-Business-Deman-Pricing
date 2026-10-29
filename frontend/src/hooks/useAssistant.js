import { useState, useCallback } from 'react';
import { assistantService } from '../services/assistantService';

export const useAssistant = () => {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ask = useCallback(async (queryText, context = {}) => {
    if (!queryText || !queryText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await assistantService.queryAssistant(queryText, context);
      if (res && res.data) {
        setResponse(res.data);
        return res.data;
      }
    } catch (err) {
      setError(err.message || 'Assistant query failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResponse(null);
    setError(null);
  }, []);

  return {
    response,
    loading,
    error,
    ask,
    reset
  };
};

