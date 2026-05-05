import type { AuthRequest } from "../middleware/auth.js";
import { demoStore } from "../data/demo-store.js";

export function writeAudit(req: AuthRequest, action: string, entity: string) {
  demoStore.activities.unshift({
    id: crypto.randomUUID(),
    actor: req.user?.email ?? "system",
    action,
    entity,
    time: "just now",
    tone: "info"
  });
}
