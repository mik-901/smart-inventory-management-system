import { Router } from "express";

import { demoStore } from "../../data/demo-store.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { userRoleSchema } from "../../validators/schemas.js";
import { writeAudit } from "../../utils/audit.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { pool, query } from "../../db/pool.js";

export const usersRouter = Router();

usersRouter.get("/", requirePermission("users:manage"), async (_req, res) => {
  if (pool) {
    try {
      const rows = await query("SELECT id, name, email, role, last_login_at FROM users ORDER BY created_at DESC");
      return res.json({ 
        data: rows.map(r => ({
          ...r,
          lastLogin: r.last_login_at,
          status: "Active"
        }))
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
  }
  res.json({ data: demoStore.users });
});

usersRouter.patch("/:id/role", requirePermission("users:manage"), validateBody(userRoleSchema), async (req: AuthRequest, res) => {
  if (pool) {
    try {
      const rows = await query("UPDATE users SET role = $1, updated_at = now() WHERE id = $2 RETURNING *", [req.body.role, req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: "User not found" });
      
      const user = rows[0];
      writeAudit(req, "updated user role", user.email);
      return res.json({ data: { ...user, lastLogin: user.last_login_at, status: "Active" } });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to update user role" });
    }
  }

  const user = demoStore.users.find((item) => item.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  user.role = req.body.role;
  writeAudit(req, "updated user role", user.email);
  res.json({ data: user });
});
