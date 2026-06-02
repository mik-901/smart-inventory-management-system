import { Router } from "express";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { SignJWT, jwtVerify } from "jose";

import { env } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import { authenticate } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import type { AuthRequest } from "../../types/index.js";
import { asyncHandler, ok } from "../../utils/http.js";
import { normalizeRole } from "../../utils/serializers.js";
import { loginSchema, registerSchema } from "../../validators/schemas.js";

export const authRouter = Router();

const scryptAsync = promisify(scrypt);
const accessSecret = new TextEncoder().encode(env.JWT_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(stored: string, supplied: string) {
  const [salt, hash] = stored.split(":");
  const derived = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(Buffer.from(hash, "hex"), derived);
}

async function signTokens(payload: { id: string; email: string; name: string; role: string }) {
  const accessToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuer(env.JWT_ISSUER ?? "smart-inventory-api")
    .sign(accessSecret);

  const refreshToken = await new SignJWT({ id: payload.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuer(env.JWT_ISSUER ?? "smart-inventory-api")
    .sign(refreshSecret);

  return { accessToken, refreshToken };
}

// ── POST /auth/login ─────────────────────────────────────────────────────────
authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const role = normalizeRole(user.role);
    const tokens = await signTokens({ id: user.id, email: user.email, name: user.name, role });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return ok(res, {
      user: { id: user.id, email: user.email, name: user.name, role },
      ...tokens
    });
  })
);

// ── POST /auth/register ──────────────────────────────────────────────────────
authRouter.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "viewer" }
    });

    const role = normalizeRole(user.role);
    const tokens = await signTokens({ id: user.id, email: user.email, name: user.name, role });

    return res.status(201).json({
      success: true,
      message: "Account created",
      data: {
        user: { id: user.id, email: user.email, name: user.name, role },
        ...tokens
      }
    });
  })
);

// ── POST /auth/refresh ───────────────────────────────────────────────────────
authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = String(req.body.refreshToken ?? "");
    if (!token) return res.status(400).json({ success: false, message: "Refresh token required" });

    try {
      const { payload } = await jwtVerify(token, refreshSecret, { audience: env.JWT_AUDIENCE });
      const userId = payload.id as string;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, message: "User not found or inactive" });
      }

      const role = normalizeRole(user.role);
      const tokens = await signTokens({ id: user.id, email: user.email, name: user.name, role });

      return ok(res, { user: { id: user.id, email: user.email, name: user.name, role }, ...tokens });
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }
  })
);

// ── GET /auth/me ─────────────────────────────────────────────────────────────
authRouter.get(
  "/me",
  authenticate,
  asyncHandler<AuthRequest>(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    return ok(res, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: normalizeRole(user.role)
    });
  })
);

// ── POST /auth/logout ────────────────────────────────────────────────────────
authRouter.post("/logout", (_req, res) => {
  return ok(res, null, "Logged out");
});
