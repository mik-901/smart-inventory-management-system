import { Router } from "express";

import { query } from "../../db/pool.js";
import { requirePermission } from "../../middleware/rbac.js";
import { asyncHandler, ok } from "../../utils/http.js";

export const activityRouter = Router();

activityRouter.get(
  "/",
  requirePermission("dashboard:read"),
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `select a.id, coalesce(u.name, 'System') as actor, a.action, a.entity_type, a.entity_id, a.created_at
         from audit_logs a
         left join users u on u.id = a.user_id
        order by a.created_at desc
        limit 50`
    );
    return ok(
      res,
      rows.map((row) => ({
        id: row.id,
        actor: row.actor,
        action: row.action,
        entity: row.entity_id ?? row.entity_type,
        time: row.created_at,
        tone: String(row.action).includes("delete") ? "danger" : String(row.action).includes("update") ? "warning" : "success"
      }))
    );
  })
);
