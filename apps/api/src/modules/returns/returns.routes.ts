import { Router } from "express";

import { demoStore } from "../../data/demo-store.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { returnSchema } from "../../validators/schemas.js";
import { writeAudit } from "../../utils/audit.js";
import type { AuthRequest } from "../../middleware/auth.js";

export const returnsRouter = Router();

returnsRouter.get("/", requirePermission("orders:read"), (_req, res) => {
  res.json({ data: demoStore.returns });
});

returnsRouter.post("/", requirePermission("orders:write"), validateBody(returnSchema), (req: AuthRequest, res) => {
  const record = {
    id: crypto.randomUUID(),
    number: `RT-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    status: "Inspection",
    date: new Date().toISOString().slice(0, 10),
    ...req.body
  };
  demoStore.returns.unshift(record);
  writeAudit(req, "created return", record.number);
  res.status(201).json({ data: record });
});
