import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import api from '@/lib/api';
import { User } from '@/types';

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

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setUser: (user: User) => void;
  loadToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  loadToken: async () => {
    try {
      const token = await getToken();
      if (token) {
        set({ accessToken: token });
        await get().fetchMe();
      }
    } catch {
      // no stored token
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      console.log('[AUTHSTORE LOGIN] Sending request for:', email);
      const res = await api.post('/auth/login', { email, password });
      console.log('[AUTHSTORE LOGIN] Response:', res.data);
      const { accessToken, user } = res.data;
      if (!accessToken) {
        throw new Error('No access token in response');
      }
      await setToken(accessToken);
      set({ user, accessToken, isAuthenticated: true });
      console.log('[AUTHSTORE LOGIN] Success - stored token and user');
    } catch (error) {
      console.error('[AUTHSTORE LOGIN] Error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    await deleteToken();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user, isAuthenticated: true });
    } catch {
      await deleteToken();
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },

  setUser: (user) => set({ user }),
}));
