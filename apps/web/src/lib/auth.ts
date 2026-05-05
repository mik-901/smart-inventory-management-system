"use client";

import { demoCredentials } from "@/lib/demo-data";
import type { UserRole } from "@/types";

export type DemoSession = {
  name: string;
  email: string;
  role: UserRole;
  token: string;
};

const SESSION_KEY = "smart_inventory_session";

const permissions: Record<UserRole, string[]> = {
  SUPER_ADMIN: ["*"],
  MANAGER: ["dashboard", "products", "inventory", "warehouses", "orders", "returns", "reports", "activity"],
  WAREHOUSE_STAFF: ["dashboard", "products", "inventory", "orders", "returns"],
  VIEWER: ["dashboard", "products", "inventory", "warehouses", "reports", "activity"]
};

export function loginWithDemoCredentials(email: string, password: string) {
  const match = demoCredentials.find((credential) => credential.email === email && credential.password === password);

  if (!match) {
    return null;
  }

  const session: DemoSession = {
    name: match.name,
    email: match.email,
    role: match.role,
    token: `demo.${btoa(`${match.email}:${match.role}`)}.signature`
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession(): DemoSession | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DemoSession;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function canAccess(role: UserRole, area: string) {
  return permissions[role].includes("*") || permissions[role].includes(area);
}
