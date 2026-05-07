import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:5000';
console.log('[API CONFIG] BASE_URL:', API_BASE_URL, 'Platform:', Platform.OS);

// Helper to safely get/set tokens (web fallback to localStorage)
const getToken = async () => {
  try {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    }
    return await SecureStore.getItemAsync('accessToken');
  } catch (error) {
    console.warn('[TOKEN STORAGE] Get error:', error);
    return null;
  }
};

const setToken = async (token: string) => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') localStorage.setItem('accessToken', token);
    } else {
      await SecureStore.setItemAsync('accessToken', token);
    }
  } catch (error) {
    console.warn('[TOKEN STORAGE] Set error:', error);
  }
};

const deleteToken = async () => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') localStorage.removeItem('accessToken');
    } else {
      await SecureStore.deleteItemAsync('accessToken');
    }
  } catch (error) {
    console.warn('[TOKEN STORAGE] Delete error:', error);
  }
};

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor — attach access token
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('[API REQUEST]', config.method?.toUpperCase(), config.url, { data: config.data });
    return config;
  },
  (error) => {
    console.log('[API REQUEST ERROR]', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor — refresh on 401
api.interceptors.response.use(
  (response) => {
    console.log('[API RESPONSE]', response.config.method?.toUpperCase(), response.config.url, { status: response.status, data: response.data });
    return response;
  },
  async (error) => {
    console.log('[API ERROR]', error.config?.method?.toUpperCase(), error.config?.url, { status: error.response?.status, message: error.message });
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const res = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh-token`, {}, { withCredentials: true });
        const { accessToken } = res.data;
        await setToken(accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        await deleteToken();
        // Let auth store handle logout
      }
    }

    return Promise.reject(error);
  }
);

export default api;
