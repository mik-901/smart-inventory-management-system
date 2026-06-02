import type { NextFunction, Response } from "express";

import { prisma } from "../db/prisma.js";
import type { AuthRequest } from "../types/index.js";

const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function auditMutations(req: AuthRequest, res: Response, next: NextFunction) {
  if (!mutatingMethods.has(req.method)) return next();

  let responseBody: unknown;
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    responseBody = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    if (res.statusCode >= 400) return;

    const segments = req.baseUrl.split("/").filter(Boolean);
    const entityType = segments.at(-1) ?? "api";
    const possibleId = req.params.id ?? req.params.productId ?? req.params.poId ?? req.params.soId;
    const entityId = typeof possibleId === "string" && possibleId.length > 8 ? possibleId : null;
    const action = `${entityType}.${req.method.toLowerCase()}`;

    void prisma.auditLog
      .create({
        data: {
          userId: req.user?.id ?? null,
          action,
          entityType,
          entityId,
          newValues: responseBody == null ? null : JSON.stringify(responseBody),
          ipAddress: req.ip ?? null,
          userAgent: req.get("user-agent") ?? null
        }
      })
      .catch((error) => {
        console.error("Failed to write audit log", error);
      });
  });

  return next();
}
