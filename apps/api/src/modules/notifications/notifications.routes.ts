import { Router } from "express";

import { query } from "../../db/pool.js";
import { requirePermission } from "../../middleware/rbac.js";
import type { AuthRequest } from "../../types/index.js";
import { asyncHandler, ok } from "../../utils/http.js";

export const notificationsRouter = Router();

function mapNotification(row: Record<string, unknown>) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: row.is_read,
    read: row.is_read,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at,
    time: row.created_at
  };
}

notificationsRouter.get(
  "/",
  requirePermission("dashboard:read"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const rows = await query("select * from notifications where user_id = $1 order by created_at desc limit 100", [req.user?.id]);
    return ok(res, rows.map(mapNotification));
  })
);

notificationsRouter.patch(
  "/:id/read",
  requirePermission("dashboard:read"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const rows = await query("update notifications set is_read = true where id = $1 and user_id = $2 returning *", [req.params.id, req.user?.id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: "Notification not found" });
    return ok(res, mapNotification(rows[0]), "Notification marked read");
  })
);

notificationsRouter.patch(
  "/read-all",
  requirePermission("dashboard:read"),
  asyncHandler<AuthRequest>(async (req, res) => {
    await query("update notifications set is_read = true where user_id = $1", [req.user?.id]);
    return ok(res, { readAll: true }, "Notifications marked read");
  })
);
