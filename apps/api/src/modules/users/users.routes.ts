import { Router } from "express";

import { demoStore } from "../../data/demo-store.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { userRoleSchema } from "../../validators/schemas.js";
import { writeAudit } from "../../utils/audit.js";
import type { AuthRequest } from "../../middleware/auth.js";

export const usersRouter = Router();

usersRouter.get("/", requirePermission("users:manage"), (_req, res) => {
  res.json({ data: demoStore.users });
});

usersRouter.patch("/:id/role", requirePermission("users:manage"), validateBody(userRoleSchema), (req: AuthRequest, res) => {
  const user = demoStore.users.find((item) => item.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  user.role = req.body.role;
  writeAudit(req, "updated user role", user.email);
  res.json({ data: user });
});
