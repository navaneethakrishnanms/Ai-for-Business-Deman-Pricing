/**
 * CampusPrice Unified API Client
 * Manages HTTP communication, Owner Bearer Token headers,
 * connecting directly to the Node backend API.
 */

import axios from 'axios';
import { API_ROUTES } from '../constants/apiRoutes';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const OWNER_TOKEN_STORAGE_KEY = 'campusprice_owner_token';
export const DEFAULT_OWNER_TOKEN = 'cp_owner_sec_2026_demo_key';

// Create Axios Client
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
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
 * Direct API request executor - No dummy/mock data fallback
 */
export async function requestApi(apiFn) {
  const res = await apiFn();
  return res.data;
}

export const requestWithFallback = requestApi;
