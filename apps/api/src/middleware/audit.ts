import type { NextFunction, Response } from "express";

import { pool } from "../db/pool.js";
import type { AuthRequest } from "../types/index.js";

const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function auditMutations(req: AuthRequest, res: Response, next: NextFunction) {
  if (!mutatingMethods.has(req.method)) return next();

  let responseBody: unknown;
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    responseBody = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    if (!pool || res.statusCode >= 400) return;

    const segments = req.baseUrl.split("/").filter(Boolean);
    const entityType = segments.at(-1) ?? "api";
    const possibleId = req.params.id ?? req.params.productId ?? req.params.poId ?? req.params.soId;
    const entityId = typeof possibleId === "string" && uuidPattern.test(possibleId) ? possibleId : null;
    const action = `${entityType}.${req.method.toLowerCase()}`;

    void pool
      .query(
        `insert into audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address, user_agent)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [
          req.user?.id ?? null,
          action,
          entityType,
          entityId,
          responseBody == null ? null : JSON.stringify(responseBody),
          req.ip,
          req.get("user-agent") ?? null
        ]
      )
      .catch((error) => {
        console.error("Failed to write audit log", error);
      });
  });

  return next();
}
