import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

import { env } from "../config/env.js";
import type { Role } from "../data/demo-store.js";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

export type AuthRequest = Request & {
  user?: AuthUser;
};

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function parseDemoToken(token: string): AuthUser | null {
  if (!token.startsWith("demo.")) return null;

  const [, payload] = token.split(".");
  if (!payload) return null;
  const decoded = Buffer.from(payload, "base64").toString("utf8");
  const [email, role] = decoded.split(":");

  if (!email || !role) return null;
  return { id: email, email, role: role as Role };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token && env.NODE_ENV !== "production") {
    req.user = { id: "demo", email: "admin@demo.com", role: "SUPER_ADMIN" };
    return next();
  }

  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const demoUser = parseDemoToken(token);
  if (demoUser) {
    req.user = demoUser;
    return next();
  }

  try {
    if (!env.CLERK_JWKS_URL) throw new Error("CLERK_JWKS_URL is not configured");
    jwks ??= createRemoteJWKSet(new URL(env.CLERK_JWKS_URL));
    const verified = await jwtVerify(token, jwks, {
      audience: env.JWT_AUDIENCE,
      issuer: env.JWT_ISSUER
    });

    req.user = {
      id: String(verified.payload.sub),
      email: String(verified.payload.email ?? ""),
      role: (verified.payload.publicMetadata as { role?: Role } | undefined)?.role ?? "VIEWER"
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
