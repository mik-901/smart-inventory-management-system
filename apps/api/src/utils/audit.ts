import type { AuthRequest } from "../middleware/auth.js";
import { demoStore } from "../data/demo-store.js";
import { pool, query } from "../db/pool.js";
import crypto from "node:crypto";

export async function writeAudit(req: AuthRequest, action: string, entity: string) {
  if (!pool) {
    demoStore.activities.unshift({
      id: crypto.randomUUID(),
      actor: req.user?.email ?? "system",
      action,
      entity,
      time: "just now",
      tone: "info"
    });
    return;
  }

  try {
    await query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user?.id || null, action, "entity", entity, req.ip, req.get("user-agent")]
    );
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
