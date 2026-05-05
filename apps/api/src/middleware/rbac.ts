import type { NextFunction, Response } from "express";

import type { AuthRequest } from "./auth.js";
import type { Role } from "../data/demo-store.js";

type Permission =
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

const rolePermissions: Record<Role, Permission[]> = {
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
  WAREHOUSE_STAFF: ["dashboard:read", "products:read", "inventory:read", "inventory:write", "orders:read", "orders:write"],
  VIEWER: ["dashboard:read", "products:read", "inventory:read", "orders:read", "reports:read"]
};

export function requirePermission(permission: Permission) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !rolePermissions[role].includes(permission)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    return next();
  };
}
