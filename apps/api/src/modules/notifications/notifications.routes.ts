import { Router } from "express";

import { demoStore } from "../../data/demo-store.js";
import { requirePermission } from "../../middleware/rbac.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { pool, query } from "../../db/pool.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", requirePermission("dashboard:read"), async (req: AuthRequest, res) => {
  if (pool) {
    try {
      const rows = await query("SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50", [req.user?.id]);
      return res.json({ 
        data: rows.map(r => ({
          ...r,
          read: r.is_read,
          time: new Date(r.created_at).toISOString()
        }))
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch notifications" });
    }
  }
  res.json({ data: demoStore.notifications });
});

notificationsRouter.patch("/:id/read", requirePermission("dashboard:read"), async (req: AuthRequest, res) => {
  if (pool) {
    try {
      const rows = await query("UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *", [req.params.id, req.user?.id]);
      if (rows.length === 0) return res.status(404).json({ error: "Notification not found" });
      
      const r = rows[0];
      return res.json({ data: { ...r, read: true, time: new Date(r.created_at).toISOString() } });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to mark notification as read" });
    }
  }

  const notification = demoStore.notifications.find((item) => item.id === req.params.id);
  if (!notification) return res.status(404).json({ error: "Notification not found" });
  notification.read = true;
  res.json({ data: notification });
});
