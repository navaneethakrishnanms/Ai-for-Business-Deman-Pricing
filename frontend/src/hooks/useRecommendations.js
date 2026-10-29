import { useState, useCallback, useEffect } from 'react';
import { recommendService } from '../services/recommendService';

export const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [frontier, setFrontier] = useState([]);
  const [overridesLog, setOverridesLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);

  const fetchRecommendations = useCallback(async ({ coverage_target, day_type_mix, include_frontier = true } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await recommendService.getRecommendations({ coverage_target, day_type_mix, include_frontier });
      if (res && res.data) {
        setRecommendations(res.data.recommendations || []);
        setSummary(res.data.summary || null);
        setFrontier(res.data.frontier || []);
        setMeta(res.meta);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOverrides = useCallback(async () => {
    try {
      const res = await recommendService.getOverrides();
      if (res && res.data) {
        setOverridesLog(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch overrides log:', err);
    }
  }, []);

  const recordDecision = useCallback(async ({ rec_id, decision, edited_value = null, note = '' }) => {
    setSubmitting(true);
    try {
      const res = await recommendService.submitOverride({ rec_id, decision, edited_value, note });
      await fetchOverrides();
      return res;
    } catch (err) {
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [fetchOverrides]);

  useEffect(() => {
    fetchRecommendations();
    fetchOverrides();
  }, [fetchRecommendations, fetchOverrides]);

  return {
    recommendations,
    summary,
    frontier,
    overridesLog,
    loading,
    submitting,
    error,
    meta,
    fetchRecommendations,
    fetchOverrides,
    recordDecision
  };
};

