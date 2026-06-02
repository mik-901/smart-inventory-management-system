import { Router } from "express";

import { prisma } from "../../db/prisma.js";
import { requirePermission } from "../../middleware/rbac.js";
import { asyncHandler, paginated } from "../../utils/http.js";
import { parseListQuery } from "../../utils/pagination.js";

export const activityRouter = Router();

activityRouter.get(
  "/",
  requirePermission("audit:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "created_at");
    const where: any = {};
    if (req.query.entityType) where.entityType = String(req.query.entityType);
    if (req.query.entityId) where.entityId = String(req.query.entityId);
    if (req.query.userId) where.userId = String(req.query.userId);

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: list.limit,
        skip: list.offset
      })
    ]);

    return paginated(
      res,
      logs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        userName: log.user?.name ?? "System",
        userEmail: log.user?.email ?? "",
        createdAt: log.createdAt,
        details: log.newValues ? JSON.parse(log.newValues) : null
      })),
      { page: list.page, limit: list.limit, total }
    );
  })
);
