import { useState, useCallback } from 'react';
import { scenarioService } from '../services/scenarioService';

export const useScenarios = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);

  const compare = useCallback(async ({ scenarios, day_type_mix }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await scenarioService.compareScenarios({ scenarios, day_type_mix });
      if (res && res.data) {
        setResults(res.data.results || []);
        setMeta(res.meta);
        return res.data.results;
      }
    } catch (err) {
      setError(err.message || 'Failed to compare scenarios');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    results,
    loading,
    error,
    meta,
    compare
  };
};

