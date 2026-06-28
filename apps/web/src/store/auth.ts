import { create } from "zustand";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  roleId: string | null;
  tenantId: string;
  role?: { id: string; name: string } | null;
  tenant?: { id: string; name: string; slug: string; defaultTheme: string; timezone: string };
  permissions?: { all?: boolean; perms?: Record<string, boolean> };
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  ready: boolean; // terminou tentativa de refresh inicial
  setAuth: (token: string, user: AuthUser | null) => void;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setReady: (ready: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  ready: false,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  setUser: (user) => set({ user }),
  setToken: (accessToken) => set({ accessToken }),
  setReady: (ready) => set({ ready }),
  clear: () => set({ accessToken: null, user: null }),
}));
