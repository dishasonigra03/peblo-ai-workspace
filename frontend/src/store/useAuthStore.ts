import { create } from "zustand";
import api from "@/utils/api";

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("peblo_token") : null,
  loading: false,
  initialized: false,
  error: null,

  signup: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/auth/signup", { name, email, password });
      const { access_token, user } = response.data;
      if (typeof window !== "undefined") {
        localStorage.setItem("peblo_token", access_token);
      }
      set({ token: access_token, user, loading: false });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Signup failed. Please try again.";
      set({ error: msg, loading: false });
      return false;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/auth/login", { email, password });
      const { access_token, user } = response.data;
      if (typeof window !== "undefined") {
        localStorage.setItem("peblo_token", access_token);
      }
      set({ token: access_token, user, loading: false });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Login failed. Please verify credentials.";
      set({ error: msg, loading: false });
      return false;
    }
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("peblo_token");
    }
    set({ token: null, user: null });
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  fetchMe: async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("peblo_token") : null;
    if (!token) {
      set({ initialized: true });
      return;
    }
    set({ loading: true, error: null });
    try {
      const response = await api.get("/auth/me");
      set({ user: response.data, token, loading: false, initialized: true });
    } catch (err) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("peblo_token");
      }
      set({ token: null, user: null, loading: false, initialized: true });
    }
  },

  clearError: () => set({ error: null }),
}));
