import { useState, useEffect, useCallback } from 'react';
import { modelService } from '../services/modelService';

export const useModelStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await modelService.getModelStatus();
      if (res && res.data) {
        setStatus(res.data);
      }
    } catch (err) {
      console.error('Failed to get model status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Poll status gently every 60s
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return { status, loading, refetch: fetchStatus };
};

