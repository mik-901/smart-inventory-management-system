import { Router } from "express";
import { z } from "zod";

import { query } from "../../db/pool.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import type { AuthRequest } from "../../types/index.js";
import { asyncHandler, ok } from "../../utils/http.js";

export const settingsRouter = Router();

const settingsSchema = z.union([
  z.array(z.object({ key: z.string().min(1), value: z.unknown(), description: z.string().optional().nullable() })),
  z.record(z.string(), z.unknown())
]);

settingsRouter.get(
  "/",
  requirePermission("dashboard:read"),
  asyncHandler(async (_req, res) => {
    const rows = await query("select key, value, description, updated_by, updated_at from settings order by key");
    return ok(
      res,
      Object.fromEntries(rows.map((row) => [row.key, { value: row.value, description: row.description, updatedBy: row.updated_by, updatedAt: row.updated_at }]))
    );
  })
);

settingsRouter.put(
  "/",
  requirePermission("settings:manage"),
  validateBody(settingsSchema),
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = req.body as Array<{ key: string; value: unknown; description?: string | null }> | Record<string, unknown>;
    const entries = Array.isArray(body)
      ? body
      : Object.entries(body).map(([key, value]) => ({ key, value, description: null }));

    for (const entry of entries) {
      await query(
        `insert into settings (key, value, description, updated_by)
         values ($1, $2, $3, $4)
         on conflict (key) do update
           set value = excluded.value,
               description = coalesce(excluded.description, settings.description),
               updated_by = excluded.updated_by,
               updated_at = now()`,
        [entry.key, JSON.stringify(entry.value), entry.description ?? null, req.user?.id ?? null]
      );
    }

    return ok(res, { updated: entries.length }, "Settings updated");
  })
);
