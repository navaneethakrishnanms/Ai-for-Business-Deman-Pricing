import { useState, useEffect, useCallback } from 'react';
import { menuService } from '../services/menuService';

export const useMenu = () => {
  const [items, setItems] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await menuService.getItems();
      if (res && res.data) {
        setItems(res.data.items || []);
        setCombos(res.data.combos || []);
        setMeta(res.meta || null);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  return {
    items,
    combos,
    loading,
    error,
    meta,
    refetch: fetchMenu
  };
};

