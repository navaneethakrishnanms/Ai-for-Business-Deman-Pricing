import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { guardrailsService } from '../services/guardrailsService';
import { DEFAULT_GUARDRAILS } from '../constants/guardrailDefaults';

const GuardrailsContext = createContext(null);

export const GuardrailsProvider = ({ children }) => {
  const [guardrails, setGuardrails] = useState(DEFAULT_GUARDRAILS);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const fetchGuardrails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await guardrailsService.getConfig();
      if (response && response.data) {
        setGuardrails(response.data);
      }
    } catch (err) {
      console.error('Failed to load guardrails:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuardrails();
  }, [fetchGuardrails]);

  const updateGuardrails = async (newConfig) => {
    setIsLoading(true);
    try {
      const response = await guardrailsService.updateConfig(newConfig);
      if (response && response.data) {
        setGuardrails(response.data);
        setLastSaved(new Date().toISOString());
        return { success: true, data: response.data };
      }
    } catch (err) {
      console.error('Failed to update guardrails:', err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GuardrailsContext.Provider value={{
      guardrails,
      isLoading,
      lastSaved,
      fetchGuardrails,
      updateGuardrails
    }}>
      {children}
    </GuardrailsContext.Provider>
  );
};

export const useGuardrailsContext = () => {
  const context = useContext(GuardrailsContext);
  if (!context) {
    throw new Error('useGuardrailsContext must be used within a GuardrailsProvider');
  }
  return context;
};

