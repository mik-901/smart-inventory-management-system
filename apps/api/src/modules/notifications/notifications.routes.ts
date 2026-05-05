import { Router } from "express";

import { demoStore } from "../../data/demo-store.js";
import { requirePermission } from "../../middleware/rbac.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", requirePermission("dashboard:read"), (_req, res) => {
  res.json({ data: demoStore.notifications });
});

notificationsRouter.patch("/:id/read", requirePermission("dashboard:read"), (req, res) => {
  const notification = demoStore.notifications.find((item) => item.id === req.params.id);
  if (!notification) return res.status(404).json({ error: "Notification not found" });
  notification.read = true;
  res.json({ data: notification });
});
