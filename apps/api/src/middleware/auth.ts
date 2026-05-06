import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

import { env } from "../config/env.js";
import type { Role } from "../data/demo-store.js";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type AuthRequest = Request & {
  user?: AuthUser;
};

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token && env.NODE_ENV !== "production") {
    req.user = { id: "demo", email: "admin@demo.com", name: "Demo Admin", role: "SUPER_ADMIN" };
    return next();
  }

  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  // 1. Try our own JWT (signed with JWT_SECRET)
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      audience: env.JWT_AUDIENCE,
      issuer: env.JWT_ISSUER ?? "smart-inventory-api"
    });

    // Reject refresh tokens used as access tokens
    if (payload.type === "refresh") {
      return res.status(401).json({ error: "Invalid token type" });
    }

    req.user = {
      id: String(payload.sub),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: (payload.role as Role) ?? "VIEWER"
    };
    return next();
  } catch {
    // Not one of our tokens — fall through to Clerk JWKS
  }

  // 2. Try Clerk JWKS if configured
  if (env.CLERK_JWKS_URL) {
    try {
      jwks ??= createRemoteJWKSet(new URL(env.CLERK_JWKS_URL));
      const verified = await jwtVerify(token, jwks, {
        audience: env.JWT_AUDIENCE,
        issuer: env.JWT_ISSUER
      });

      req.user = {
        id: String(verified.payload.sub),
        email: String(verified.payload.email ?? ""),
        name: String(verified.payload.name ?? ""),
        role: (verified.payload.publicMetadata as { role?: Role } | undefined)?.role ?? "VIEWER"
      };
      return next();
    } catch {
      // Also failed
    }
  }

  return res.status(401).json({ error: "Invalid or expired token" });
}
