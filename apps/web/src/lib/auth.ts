"use client";

// Re-export everything from the new auth context module for backward compatibility
export { useAuth, canAccess, getAccessToken, type AuthUser } from "@/lib/auth-context";
export type { AuthUser as DemoSession } from "@/lib/auth-context";

// Legacy helpers — redirect to context-based auth
export function getSession() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("smart_inv_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("smart_inv_access_token");
  localStorage.removeItem("smart_inv_refresh_token");
  localStorage.removeItem("smart_inv_user");
  localStorage.removeItem("smart_inventory_session");
}
