import { create } from "zustand";
import api from "@/lib/api";
import type { User, TokenResponse, UzexRegisterData, UzexLoginData } from "@/types";

type AuthMode = "basic" | "uzex";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialized: boolean;
  authMode: AuthMode;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    full_name: string,
    phone?: string
  ) => Promise<void>;
  uzexLogin: (data: UzexLoginData) => Promise<void>;
  uzexRegister: (data: UzexRegisterData) => Promise<void>;
  fetchAuthMode: () => Promise<AuthMode>;
  logout: () => void;
  loadUser: () => Promise<void>;
  setUser: (user: User) => void;
  init: () => void;
}

function storeTokens(tokens: TokenResponse) {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  initialized: false,
  authMode: "basic",

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
    storeTokens(data.data);
    set({ isAuthenticated: true });
  },

  register: async (email, password, full_name, phone) => {
    const { data } = await api.post<{ data: TokenResponse }>(
      "/v1/auth/register",
      { email, password, full_name, phone }
    );
    storeTokens(data.data);
    set({ isAuthenticated: true });
  },

  uzexLogin: async (loginData) => {
    const { data } = await api.post<{ data: TokenResponse }>(
      "/v1/auth/uzex-login",
      loginData
    );
    storeTokens(data.data);
    set({ isAuthenticated: true });
  },

  uzexRegister: async (registerData) => {
    const { data } = await api.post<{ data: TokenResponse }>(
      "/v1/auth/uzex-register",
      registerData
    );
    storeTokens(data.data);
    set({ isAuthenticated: true });
  },

  fetchAuthMode: async () => {
    try {
      const { data } = await api.get<{ data: { mode: AuthMode } }>("/v1/auth/mode");
      const mode = data.data.mode;
      set({ authMode: mode });
      return mode;
    } catch {
      return "basic";
    }
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
