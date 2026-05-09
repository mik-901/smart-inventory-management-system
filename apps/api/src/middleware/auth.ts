import type { NextFunction, Response } from "express";
import { jwtVerify } from "jose";

import { env } from "../config/env.js";
import type { AuthRequest, Role } from "../types/index.js";

const ACCESS_SECRET = new TextEncoder().encode(env.JWT_SECRET);

export type { AuthRequest } from "../types/index.js";

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Missing bearer token" });
  }

  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET, {
      audience: env.JWT_AUDIENCE,
      issuer: env.JWT_ISSUER ?? "smart-inventory-api"
    });

    if (payload.type === "refresh") {
      return res.status(401).json({ success: false, message: "Refresh tokens cannot access API routes" });
    }

    req.user = {
      id: String(payload.sub),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: (payload.role as Role) ?? "viewer"
    };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}
