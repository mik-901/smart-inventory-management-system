"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserRole } from "@/types";

// ── types ────────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
};

// ── constants ────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const ACCESS_TOKEN_KEY = "smart_inv_access_token";
const REFRESH_TOKEN_KEY = "smart_inv_refresh_token";
const USER_KEY = "smart_inv_user";

// ── helpers ──────────────────────────────────────────────────────────────────

function getStored<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStored(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  if (value == null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  }
}

function clearAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Also clear legacy session key
  localStorage.removeItem("smart_inventory_session");
}

// ── permissions ──────────────────────────────────────────────────────────────

const permissions: Record<UserRole, string[]> = {
  admin: ["*"],
  manager: ["dashboard", "products", "inventory", "warehouses", "orders", "purchase-orders", "sales-orders", "transfers", "returns", "reports", "activity", "notifications", "settings"],
  staff: ["dashboard", "products", "inventory", "orders", "purchase-orders", "sales-orders", "transfers", "returns", "warehouses", "notifications"],
  viewer: ["dashboard", "products", "inventory", "warehouses", "reports", "activity", "notifications"]
};

export function canAccess(role: UserRole, area: string) {
  return permissions[role]?.includes("*") || permissions[role]?.includes(area);
}

// ── context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── persist helpers ──────────────────────────────────────────────────────

  const saveSession = useCallback((data: { user: AuthUser; accessToken: string; refreshToken: string }) => {
    setUser(data.user);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setStored(USER_KEY, data.user);
    setStored(ACCESS_TOKEN_KEY, data.accessToken);
    setStored(REFRESH_TOKEN_KEY, data.refreshToken);
  }, []);

  // ── restore on mount ────────────────────────────────────────────────────

  useEffect(() => {
    const storedUser = getStored<AuthUser>(USER_KEY);
    const storedAccess = localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);

    // Migrate legacy demo sessions
    const legacyRaw = localStorage.getItem("smart_inventory_session");
    if (legacyRaw && !storedAccess) {
      try {
        const legacy = JSON.parse(legacyRaw);
        if (legacy.token && legacy.email) {
          // Legacy demo session — require a fresh login
          clearAuth();
          setIsLoading(false);
          return;
        }
      } catch {
        // ignore
      }
    }

    if (storedUser && storedAccess) {
      setUser(storedUser);
      setAccessToken(storedAccess);
      setRefreshToken(storedRefresh);
    }

    setIsLoading(false);
  }, []);

  // ── login ────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.message ?? body.error ?? "Login failed");
      }

      saveSession({
        user: body.data.user,
        accessToken: body.data.accessToken,
        refreshToken: body.data.refreshToken
      });
      
      return body.data.user;
    },
    [saveSession]
  );

  // ── register ─────────────────────────────────────────────────────────────

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<AuthUser> => {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.message ?? body.error ?? "Registration failed");
      }

      saveSession({
        user: body.data.user,
        accessToken: body.data.accessToken,
        refreshToken: body.data.refreshToken
      });
      
      return body.data.user;
    },
    [saveSession]
  );

  // ── logout ───────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  }, []);

  // ── refresh ──────────────────────────────────────────────────────────────

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const currentRefresh = refreshToken ?? localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!currentRefresh) return false;

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: currentRefresh })
      });

      if (!res.ok) {
        logout();
        return false;
      }

      const body = await res.json();
      setAccessToken(body.data.accessToken);
      setRefreshToken(body.data.refreshToken);
      setStored(ACCESS_TOKEN_KEY, body.data.accessToken);
      setStored(REFRESH_TOKEN_KEY, body.data.refreshToken);
      return true;
    } catch {
      logout();
      return false;
    }
  }, [refreshToken, logout]);

  // ── value ────────────────────────────────────────────────────────────────

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      refreshToken,
      isLoading,
      isAuthenticated: !!user && !!accessToken,
      login,
      register,
      logout,
      refreshSession
    }),
    [user, accessToken, refreshToken, isLoading, login, register, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

// ── authenticated fetch helper ───────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}
