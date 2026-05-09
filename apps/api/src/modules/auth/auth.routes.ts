import { Router } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { SignJWT, jwtVerify } from "jose";

import { env } from "../../config/env.js";
import { demoStore, type Role } from "../../data/demo-store.js";
import { validateBody } from "../../middleware/validate.js";
import { loginSchema, registerSchema } from "../../validators/schemas.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { pool, query } from "../../db/pool.js";

const scryptAsync = promisify(scrypt);

// ── helpers ──────────────────────────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(":");
  if (!salt || !key) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(Buffer.from(key, "hex"), derived);
}

async function createTokens(user: { id: string; email: string; role: Role; name: string }) {
  const accessToken = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .setAudience(env.JWT_AUDIENCE)
    .setIssuer(env.JWT_ISSUER ?? "smart-inventory-api")
    .sign(JWT_SECRET);

  const refreshToken = await new SignJWT({ sub: user.id, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setAudience(env.JWT_AUDIENCE)
    .setIssuer(env.JWT_ISSUER ?? "smart-inventory-api")
    .sign(JWT_SECRET);

  return { accessToken, refreshToken };
}

// ── routes ───────────────────────────────────────────────────────────────────

export const authRouter = Router();

// Register
authRouter.post("/register", validateBody(registerSchema), async (req, res) => {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };
    const passwordHash = await hashPassword(password);

    if (pool) {
      const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
      if (existing.length > 0) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }

      const rows = await query(
        "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
        [name, email, passwordHash, "VIEWER"]
      );
      const user = rows[0];
      const tokens = await createTokens({ id: user.id, email: user.email, role: user.role as Role, name: user.name });

      return res.status(201).json({
        data: { user, ...tokens }
      });
    }

    // Fallback to demoStore
    const exists = demoStore.users.find((u) => u.email === email);
    if (exists) return res.status(409).json({ error: "An account with this email already exists" });

    const user = {
      id: `usr-${randomBytes(4).toString("hex")}`,
      name,
      email,
      role: "VIEWER" as Role,
      passwordHash,
      lastLogin: new Date().toISOString(),
      status: "Active"
    };
    demoStore.users.push(user);
    const tokens = await createTokens(user);

    return res.status(201).json({
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        ...tokens
      }
    });
  } catch (error: any) {
    console.error("REGISTER ERROR:", error);
    return res.status(500).json({ error: "Registration failed", detail: error?.message ?? String(error) });
  }
});

// Login
authRouter.post("/login", validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (pool) {
      const rows = await query("SELECT id, name, email, role, password_hash FROM users WHERE email = $1", [email]);
      if (rows.length === 0) return res.status(401).json({ error: "Invalid email or password" });

      const user = rows[0];
      if (user.password_hash) {
        const valid = await verifyPassword(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: "Invalid email or password" });
      } else {
        if (password !== "inventory123") return res.status(401).json({ error: "Invalid email or password" });
      }

      await query("UPDATE users SET last_login_at = now() WHERE id = $1", [user.id]);

      const tokens = await createTokens({ id: user.id, email: user.email, role: user.role as Role, name: user.name });
      return res.json({
        data: {
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
          ...tokens
        }
      });
    }

    // Fallback to demoStore
    const user = demoStore.users.find((u) => u.email === email);
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    if (user.passwordHash) {
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: "Invalid email or password" });
    } else {
      if (password !== "inventory123") return res.status(401).json({ error: "Invalid email or password" });
    }

    user.lastLogin = new Date().toISOString();
    const tokens = await createTokens({ id: user.id, email: user.email, role: user.role as Role, name: user.name });

    return res.json({
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        ...tokens
      }
    });
  } catch (error: any) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ error: "Login failed", detail: error?.message ?? String(error) });
  }
});

// Get current user
authRouter.get("/me", async (req: AuthRequest, res) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing bearer token" });

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      audience: env.JWT_AUDIENCE,
      issuer: env.JWT_ISSUER ?? "smart-inventory-api"
    });

    if (pool) {
      const rows = await query("SELECT id, name, email, role, last_login_at FROM users WHERE id = $1", [payload.sub]);
      if (rows.length === 0) return res.status(401).json({ error: "User not found" });
      const user = rows[0];
      return res.json({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLogin: user.last_login_at,
          status: "Active"
        }
      });
    }

    const user = demoStore.users.find((u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });

    return res.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        status: user.status
      }
    });
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

// Refresh token
authRouter.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) return res.status(400).json({ error: "Refresh token is required" });

    const { payload } = await jwtVerify(refreshToken, JWT_SECRET, {
      audience: env.JWT_AUDIENCE,
      issuer: env.JWT_ISSUER ?? "smart-inventory-api"
    });

    if (payload.type !== "refresh") return res.status(401).json({ error: "Invalid token type" });

    if (pool) {
      const rows = await query("SELECT id, name, email, role FROM users WHERE id = $1", [payload.sub]);
      if (rows.length === 0) return res.status(401).json({ error: "User not found" });
      const user = rows[0];
      const tokens = await createTokens({ id: user.id, email: user.email, role: user.role as Role, name: user.name });
      return res.json({ data: tokens });
    }

    const user = demoStore.users.find((u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });

    const tokens = await createTokens({ id: user.id, email: user.email, role: user.role as Role, name: user.name });
    return res.json({ data: tokens });
  } catch {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});
