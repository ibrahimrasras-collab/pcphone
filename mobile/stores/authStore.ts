import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import api from "../utils/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  extension: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    await SecureStore.setItemAsync("access_token", data.data.tokens.accessToken);
    await SecureStore.setItemAsync("refresh_token", data.data.tokens.refreshToken);
    set({ user: data.data.user, isAuthenticated: true });
  },

  register: async (email: string, password: string, name: string) => {
    const { data } = await api.post("/auth/register", { email, password, name });
    await SecureStore.setItemAsync("access_token", data.data.tokens.accessToken);
    await SecureStore.setItemAsync("refresh_token", data.data.tokens.refreshToken);
    set({ user: data.data.user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync("refresh_token");
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch {
      // ignore
    }
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = await SecureStore.getItemAsync("access_token");
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const { data } = await api.get("/auth/me");
      set({ user: data.data.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
