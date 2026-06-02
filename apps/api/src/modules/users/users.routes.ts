import { Router } from "express";

import { prisma } from "../../db/prisma.js";
import { requireAdmin, requirePermission } from "../../middleware/rbac.js";
import type { AuthRequest } from "../../types/index.js";
import { asyncHandler, ok, paginated } from "../../utils/http.js";
import { parseListQuery } from "../../utils/pagination.js";
import { normalizeRole } from "../../utils/serializers.js";

export const usersRouter = Router();

usersRouter.get(
  "/",
  requirePermission("users:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "created_at");
    const where: any = {};
    if (list.search) {
      where.OR = [
        { name: { contains: list.search } },
        { email: { contains: list.search } }
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: list.limit,
        skip: list.offset
      })
    ]);

    return paginated(
      res,
      users.map((u) => ({ ...u, role: normalizeRole(u.role) })),
      { page: list.page, limit: list.limit, total }
    );
  })
);

usersRouter.get(
  "/:id",
  requirePermission("users:read"),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: String(req.params.id) },
      select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return ok(res, { ...user, role: normalizeRole(user.role) });
  })
);

usersRouter.patch(
  "/:id/role",
  requireAdmin,
  asyncHandler<AuthRequest>(async (req, res) => {
    const role = String(req.body.role ?? "");
    if (!["admin", "manager", "staff", "viewer"].includes(role)) {
      return res.status(422).json({ success: false, message: "Invalid role" });
    }
    const user = await prisma.user.update({
      where: { id: String(req.params.id) },
      data: { role },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });
    return ok(res, user, "Role updated");
  })
);

usersRouter.patch(
  "/:id/status",
  requireAdmin,
  asyncHandler<AuthRequest>(async (req, res) => {
    const isActive = Boolean(req.body.isActive ?? req.body.is_active);
    const user = await prisma.user.update({
      where: { id: String(req.params.id) },
      data: { isActive },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });
    return ok(res, user, `User ${isActive ? "activated" : "deactivated"}`);
  })
);
