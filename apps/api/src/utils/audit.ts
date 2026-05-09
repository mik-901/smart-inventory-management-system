import type { AuthRequest } from "../middleware/auth.js";
import { query } from "../db/pool.js";

export async function writeAudit(req: AuthRequest, action: string, entityType: string, entityId?: string | null, newValues?: unknown) {
  await query(
    `insert into audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address, user_agent)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [
      req.user?.id ?? null,
      action,
      entityType,
      entityId ?? null,
      newValues == null ? null : JSON.stringify(newValues),
      req.ip,
      req.get("user-agent") ?? null
    ]
  );
}
