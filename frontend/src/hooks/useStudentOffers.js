import { useState, useCallback, useEffect } from 'react';
import { studentService } from '../services/studentService';

export const useStudentOffers = (initialBudget = 100) => {
  const [budget, setBudget] = useState(initialBudget);
  const [offers, setOffers] = useState({ single_items: [], combos: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);

  const fetchOffers = useCallback(async (budgetValue) => {
    const targetBudget = budgetValue !== undefined ? budgetValue : budget;
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.getStudentOffers(targetBudget);
      if (res && res.data) {
        setOffers({
          single_items: res.data.single_items || [],
          combos: res.data.combos || []
        });
        setMeta(res.meta);
      }
    } catch (err) {
      setError(err.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, [budget]);

  useEffect(() => {
    fetchOffers(budget);
  }, [budget, fetchOffers]);

  return {
    budget,
    setBudget,
    offers,
    loading,
    error,
    meta,
    refetch: () => fetchOffers(budget)
  };
};

