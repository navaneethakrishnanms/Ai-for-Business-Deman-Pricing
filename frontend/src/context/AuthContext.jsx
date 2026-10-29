import React, { createContext, useContext, useState, useEffect } from 'react';
import { OWNER_TOKEN_STORAGE_KEY, DEFAULT_OWNER_TOKEN } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [ownerToken, setOwnerToken] = useState(() => {
    return localStorage.getItem(OWNER_TOKEN_STORAGE_KEY) || DEFAULT_OWNER_TOKEN;
  });

  const [activeRole, setActiveRole] = useState('owner'); // 'owner' | 'student'

  const updateToken = (newToken) => {
    setOwnerToken(newToken);
    if (newToken) {
      localStorage.setItem(OWNER_TOKEN_STORAGE_KEY, newToken);
    } else {
      localStorage.removeItem(OWNER_TOKEN_STORAGE_KEY);
    }
  };

  const isOwner = activeRole === 'owner';

  return (
    <AuthContext.Provider value={{
      ownerToken,
      updateToken,
      activeRole,
      setActiveRole,
      isOwner
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

