/**
 * CampusPrice Unified API Client
 * Manages HTTP communication, Owner Bearer Token headers,
 * and resilient fallback to mathematical simulation if the server is offline.
 */

import axios from 'axios';
import { mockBackend } from './mockBackend';
import { API_ROUTES } from '../constants/apiRoutes';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const OWNER_TOKEN_STORAGE_KEY = 'campusprice_owner_token';
export const DEFAULT_OWNER_TOKEN = 'cp_owner_sec_2026_demo_key';

// Create Axios Client
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach Owner Token when available and route is an Owner endpoint
apiClient.interceptors.request.use((config) => {
  const isStudentRoute = config.url && config.url.includes(API_ROUTES.STUDENT_OFFERS);
  
  if (!isStudentRoute) {
    const ownerToken = localStorage.getItem(OWNER_TOKEN_STORAGE_KEY) || DEFAULT_OWNER_TOKEN;
    if (ownerToken) {
      config.headers.Authorization = `Bearer ${ownerToken}`;
    }
  }
  return config;
}, (error) => Promise.reject(error));

/**
 * Universal wrapper with automatic graceful fallback to mockBackend
 */
export async function requestWithFallback(apiFn, mockFn) {
  try {
    const res = await apiFn();
    if (res && res.data) {
      return res.data;
    }
  } catch (err) {
    // If backend is offline or network error, fallback to mock engine
    // console.info('[CampusPrice Client] Running in standalone/fallback simulation mode:', err.message);
  }
  return await mockFn();
}

