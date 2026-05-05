export type UserRole = "SUPER_ADMIN" | "MANAGER" | "WAREHOUSE_STAFF" | "VIEWER";

export type Permission =
  | "dashboard:read"
  | "products:read"
  | "products:write"
  | "inventory:read"
  | "inventory:write"
  | "orders:read"
  | "orders:write"
  | "reports:read"
  | "users:manage"
  | "settings:manage";

export const rolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "dashboard:read",
    "products:read",
    "products:write",
    "inventory:read",
    "inventory:write",
    "orders:read",
    "orders:write",
    "reports:read",
    "users:manage",
    "settings:manage"
  ],
  MANAGER: [
    "dashboard:read",
    "products:read",
    "products:write",
    "inventory:read",
    "inventory:write",
    "orders:read",
    "orders:write",
    "reports:read"
  ],
  WAREHOUSE_STAFF: [
    "dashboard:read",
    "products:read",
    "inventory:read",
    "inventory:write",
    "orders:read",
    "orders:write"
  ],
  VIEWER: ["dashboard:read", "products:read", "inventory:read", "orders:read", "reports:read"]
};
