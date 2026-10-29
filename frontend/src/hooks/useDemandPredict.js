import { useState, useCallback } from 'react';
import { demandService } from '../services/demandService';

export const useDemandPredict = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);

  const runPrediction = useCallback(async ({ item_id, price, portion_size_g, discount_pct = 0, day_type = 'regular' }) => {
    if (!item_id || !price) return;
    setLoading(true);
    setError(null);
    try {
      const res = await demandService.predict({ item_id, price, portion_size_g, discount_pct, day_type });
      if (res && res.data) {
        setPrediction(res.data);
        setMeta(res.meta);
        return res.data;
      }
    } catch (err) {
      setError(err.message || 'Demand prediction failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    prediction,
    loading,
    error,
    meta,
    runPrediction
  };
};

