import { Router } from "express";

import { demoStore } from "../../data/demo-store.js";
import { requirePermission } from "../../middleware/rbac.js";

export const activityRouter = Router();

activityRouter.get("/", requirePermission("dashboard:read"), (_req, res) => {
  res.json({ data: demoStore.activities });
});
