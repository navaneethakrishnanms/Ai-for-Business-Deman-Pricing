import { useState, useCallback, useEffect } from 'react';
import { comboService } from '../services/comboService';

export const useComboStudio = () => {
  const [evaluation, setEvaluation] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [evalLoading, setEvalLoading] = useState(false);
  const [suggLoading, setSuggLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);

  const fetchSuggestions = useCallback(async () => {
    setSuggLoading(true);
    try {
      const res = await comboService.getComboSuggestions();
      if (res && res.data) {
        setSuggestions(res.data.suggestions || []);
      }
    } catch (err) {
      console.error('Failed to fetch combo suggestions:', err);
    } finally {
      setSuggLoading(false);
    }
  }, []);

  const evaluate = useCallback(async ({ main_item_id, addon_item_id, discount_pct = 12, day_type = 'regular' }) => {
    if (!main_item_id || !addon_item_id) return;
    setEvalLoading(true);
    setError(null);
    try {
      const res = await comboService.evaluateCombo({ main_item_id, addon_item_id, discount_pct, day_type });
      if (res && res.data) {
        setEvaluation(res.data);
        setMeta(res.meta);
        return res.data;
      }
    } catch (err) {
      setError(err.message || 'Combo evaluation failed');
    } finally {
      setEvalLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return {
    evaluation,
    suggestions,
    evalLoading,
    suggLoading,
    error,
    meta,
    evaluate,
    fetchSuggestions
  };
};

