import { Router } from "express";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { jwtVerify, SignJWT } from "jose";

import { env } from "../../config/env.js";
import { authenticate } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { query, queryOne } from "../../db/pool.js";
import { asyncHandler, created, ok } from "../../utils/http.js";
import { loginSchema, registerSchema } from "../../validators/schemas.js";
import type { AuthRequest, Role } from "../../types/index.js";

const scryptAsync = promisify(scrypt);
const ACCESS_SECRET = new TextEncoder().encode(env.JWT_SECRET);
const REFRESH_SECRET = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

type DbUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  password_hash: string;
  is_active: boolean;
};

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(":");
  if (!salt || !key) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== derived.length) return false;
  return timingSafeEqual(keyBuffer, derived);
}

async function createTokens(user: Pick<DbUser, "id" | "email" | "role" | "name">) {
  const accessToken = await new SignJWT({
    email: user.email,
    role: user.role,
    name: user.name
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuer(env.JWT_ISSUER ?? "smart-inventory-api")
    .sign(ACCESS_SECRET);

  const refreshToken = await new SignJWT({ type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuer(env.JWT_ISSUER ?? "smart-inventory-api")
    .sign(REFRESH_SECRET);

  return { accessToken, refreshToken };
}

function publicUser(user: Pick<DbUser, "id" | "name" | "email" | "role">) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export const authRouter = Router();

authRouter.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body as { name: string; email: string; password: string };
    const passwordHash = await hashPassword(password);

    const existing = await queryOne("select id from users where lower(email) = lower($1)", [email]);
    if (existing) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }

    const user = await queryOne<DbUser>(
      `insert into users (name, email, password_hash, role)
       values ($1, lower($2), $3, 'viewer')
       returning id, name, email, role, password_hash, is_active`,
      [name, email, passwordHash]
    );

    if (!user) throw new Error("Unable to create user");
    const tokens = await createTokens(user);
    return created(res, { user: publicUser(user), ...tokens }, "Registration successful");
  })
);

authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const user = await queryOne<DbUser>(
      "select id, name, email, role, password_hash, is_active from users where lower(email) = lower($1)",
      [email]
    );

    if (!user || !user.is_active || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    await query("update users set last_login_at = now() where id = $1", [user.id]);
    const tokens = await createTokens(user);
    return ok(res, { user: publicUser(user), ...tokens }, "Login successful");
  })
);

authRouter.post("/logout", (_req, res) => {
  return ok(res, { loggedOut: true }, "Logout successful");
});

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token is required" });
    }

    try {
      const { payload } = await jwtVerify(refreshToken, REFRESH_SECRET, {
        audience: env.JWT_AUDIENCE,
        issuer: env.JWT_ISSUER ?? "smart-inventory-api"
      });

      if (payload.type !== "refresh") {
        return res.status(401).json({ success: false, message: "Invalid token type" });
      }

      const user = await queryOne<DbUser>(
        "select id, name, email, role, password_hash, is_active from users where id = $1 and is_active = true",
        [payload.sub]
      );
      if (!user) return res.status(401).json({ success: false, message: "User not found" });

      const tokens = await createTokens(user);
      return ok(res, { user: publicUser(user), ...tokens }, "Token refreshed");
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }
  })
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler<AuthRequest>(async (req, res) => {
    const user = await queryOne<
      Pick<DbUser, "id" | "name" | "email" | "role"> & {
        last_login_at: Date | null;
        created_at: Date;
      }
    >(
      "select id, name, email, role, last_login_at, created_at from users where id = $1 and is_active = true",
      [req.user?.id]
    );

    if (!user) return res.status(401).json({ success: false, message: "User not found" });
    return ok(res, { ...publicUser(user), lastLogin: user.last_login_at, createdAt: user.created_at });
  })
);
