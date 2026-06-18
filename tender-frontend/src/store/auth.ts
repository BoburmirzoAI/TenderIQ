import { create } from "zustand";
import api from "@/lib/api";
import type { User, TokenResponse } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    full_name: string,
    phone?: string
  ) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  setUser: (user: User) => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  initialized: false,

  init: () => {
    if (get().initialized) return;
    const token = localStorage.getItem("access_token");
    set({ isAuthenticated: !!token, initialized: true });
  },

  login: async (email, password) => {
    const { data } = await api.post<{ data: TokenResponse }>(
      "/v1/auth/login",
      { email, password }
    );
    const tokens = data.data;
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    set({ isAuthenticated: true });
  },

  register: async (email, password, full_name, phone) => {
    const { data } = await api.post<{ data: TokenResponse }>(
      "/v1/auth/register",
      { email, password, full_name, phone }
    );
    const tokens = data.data;
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    set({ isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, isAuthenticated: false });
    window.location.href = "/login";
  },

  setUser: (user: User) => set({ user }),

  loadUser: async () => {
    try {
      set({ isLoading: true });
      const { data } = await api.get<{ data: User }>("/v1/auth/me");
      set({ user: data.data, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
