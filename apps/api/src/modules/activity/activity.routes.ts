import { Router } from "express";

import { demoStore } from "../../data/demo-store.js";
import { requirePermission } from "../../middleware/rbac.js";
import { pool, query } from "../../db/pool.js";

export const activityRouter = Router();

activityRouter.get("/", requirePermission("dashboard:read"), async (_req, res) => {
  if (pool) {
    try {
      const rows = await query(`
        SELECT a.id, u.email as actor, a.action, a.entity_id as entity, a.created_at as time
        FROM audit_logs a
        LEFT JOIN users u ON a.actor_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 50
      `);
      return res.json({ 
        data: rows.map(r => ({
          ...r,
          tone: r.action.includes("deleted") ? "danger" : r.action.includes("updated") ? "warning" : "success"
        }))
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch activities" });
    }
  }
  res.json({ data: demoStore.activities });
});
