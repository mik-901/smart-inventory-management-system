import { Router } from "express";

import { prisma } from "../../db/prisma.js";
import { requireAdmin, requirePermission } from "../../middleware/rbac.js";
import type { AuthRequest } from "../../types/index.js";
import { asyncHandler, ok } from "../../utils/http.js";

export const settingsRouter = Router();

settingsRouter.get(
  "/",
  requirePermission("settings:manage"),
  asyncHandler(async (_req, res) => {
    const settings = await prisma.setting.findMany();
    const result = settings.reduce(
      (acc, s) => {
        try {
          acc[s.key] = JSON.parse(s.value);
        } catch {
          acc[s.key] = s.value;
        }
        return acc;
      },
      {} as Record<string, unknown>
    );
    return ok(res, result);
  })
);

settingsRouter.put(
  "/",
  requireAdmin,
  asyncHandler<AuthRequest>(async (req, res) => {
    const updates = req.body;
    if (typeof updates !== "object" || updates === null) {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }

    await prisma.$transaction(async (tx) => {
      for (const [key, value] of Object.entries(updates)) {
        const valStr = JSON.stringify(value);
        await tx.setting.upsert({
          where: { key },
          update: { value: valStr, updatedBy: req.user?.id ?? null },
          create: { key, value: valStr, updatedBy: req.user?.id ?? null }
        });
      }
    });

    const newSettings = await prisma.setting.findMany();
    const result = newSettings.reduce(
      (acc, s) => {
        try {
          acc[s.key] = JSON.parse(s.value);
        } catch {
          acc[s.key] = s.value;
        }
        return acc;
      },
      {} as Record<string, unknown>
    );

    return ok(res, result, "Settings updated");
  })
);
