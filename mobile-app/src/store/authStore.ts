import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '@/lib/api';
import { User } from '@/types';

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
      const token = await SecureStore.getItemAsync('accessToken');
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
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, user } = res.data;
    await SecureStore.setItemAsync('accessToken', accessToken);
    set({ user, accessToken, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    await SecureStore.deleteItemAsync('accessToken');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user, isAuthenticated: true });
    } catch {
      await SecureStore.deleteItemAsync('accessToken');
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },

  setUser: (user) => set({ user }),
}));
