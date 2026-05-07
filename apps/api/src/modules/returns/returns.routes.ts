import { Router } from "express";

import { demoStore } from "../../data/demo-store.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { returnSchema } from "../../validators/schemas.js";
import { writeAudit } from "../../utils/audit.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { pool, query } from "../../db/pool.js";

export const returnsRouter = Router();

returnsRouter.get("/", requirePermission("orders:read"), async (_req, res) => {
  if (pool) {
    try {
      const rows = await query("SELECT * FROM returns ORDER BY created_at DESC");
      return res.json({ 
        data: rows.map(r => ({
          ...r,
          id: r.id,
          number: r.return_number,
          date: new Date(r.created_at).toISOString().split('T')[0]
        }))
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch returns" });
    }
  }
  res.json({ data: demoStore.returns });
});

returnsRouter.post("/", requirePermission("orders:write"), validateBody(returnSchema), async (req: AuthRequest, res) => {
  const { reason, status, items } = req.body;
  const num = `RT-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;

  if (pool) {
    try {
      const rows = await query(`
        INSERT INTO returns (return_number, reason, status, total_items)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [num, reason, status || "Inspection", items?.length || 0]);
      
      const record = rows[0];
      writeAudit(req, "created return", record.return_number);
      return res.status(201).json({ 
        data: {
          ...record,
          number: record.return_number,
          date: new Date(record.created_at).toISOString().split('T')[0]
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create return" });
    }
  }

  const record = {
    id: crypto.randomUUID(),
    number: num,
    status: status || "Inspection",
    date: new Date().toISOString().slice(0, 10),
    ...req.body,
    items: req.body.items?.length || 0
  };
  demoStore.returns.unshift(record);
  writeAudit(req, "created return", record.number);
  res.status(201).json({ data: record });
});
