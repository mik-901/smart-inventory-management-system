import { Router } from "express";

import { prisma } from "../../db/prisma.js";
import { authenticate } from "../../middleware/auth.js";
import type { AuthRequest } from "../../types/index.js";
import { asyncHandler, noContent, ok, paginated } from "../../utils/http.js";
import { parseListQuery } from "../../utils/pagination.js";

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);

notificationsRouter.get(
  "/",
  asyncHandler<AuthRequest>(async (req, res) => {
    const list = parseListQuery(req, "created_at");
    const where: any = { userId: req.user!.id };
    if (req.query.unreadOnly === "true") where.isRead = false;

    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: list.limit,
        skip: list.offset
      })
    ]);

    return paginated(res, notifications, { page: list.page, limit: list.limit, total });
  })
);

notificationsRouter.get(
  "/unread-count",
  asyncHandler<AuthRequest>(async (req, res) => {
    const count = await prisma.notification.count({
      where: { userId: req.user!.id, isRead: false }
    });
    return ok(res, { count });
  })
);

notificationsRouter.post(
  "/:id/read",
  asyncHandler<AuthRequest>(async (req, res) => {
    await prisma.notification.updateMany({
      where: { id: String(req.params.id), userId: req.user!.id },
      data: { isRead: true }
    });
    return noContent(res);
  })
);

notificationsRouter.post(
  "/read-all",
  asyncHandler<AuthRequest>(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true }
    });
    return noContent(res);
  })
);

notificationsRouter.delete(
  "/:id",
  asyncHandler<AuthRequest>(async (req, res) => {
    await prisma.notification.deleteMany({
      where: { id: String(req.params.id), userId: req.user!.id }
    });
    return noContent(res);
  })
);
