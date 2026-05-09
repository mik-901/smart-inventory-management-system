import type { NextFunction, Response } from "express";

import type { AuthRequest, Role } from "../types/index.js";

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

const rank: Record<Role, number> = {
  viewer: 1,
  staff: 2,
  manager: 3,
  admin: 4
};

const rolePermissions: Record<Role, Permission[]> = {
  admin: [
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
  manager: [
    "dashboard:read",
    "products:read",
    "products:write",
    "inventory:read",
    "inventory:write",
    "orders:read",
    "orders:write",
    "reports:read",
    "settings:manage"
  ],
  staff: ["dashboard:read", "products:read", "inventory:read", "inventory:write", "orders:read", "orders:write"],
  viewer: ["dashboard:read", "products:read", "inventory:read", "orders:read", "reports:read"]
};

export function requireMinimumRole(minimum: Role) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || rank[role] < rank[minimum]) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }
    return next();
  };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin role required" });
  }
  return next();
}

export function requirePermission(permission: Permission) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !rolePermissions[role].includes(permission)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }
    return next();
  };
}
