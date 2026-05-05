import { Router } from "express";

import { demoStore } from "../../data/demo-store.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { inventoryAdjustmentSchema } from "../../validators/schemas.js";
import { writeAudit } from "../../utils/audit.js";
import type { AuthRequest } from "../../middleware/auth.js";

export const inventoryRouter = Router();

inventoryRouter.get("/", requirePermission("inventory:read"), (_req, res) => {
  res.json({ data: demoStore.inventory });
});

inventoryRouter.post("/adjust", requirePermission("inventory:write"), validateBody(inventoryAdjustmentSchema), (req: AuthRequest, res) => {
  const { sku, quantity, type } = req.body;
  const row = demoStore.inventory.find((item) => item.sku === sku);

  if (!row) return res.status(404).json({ error: "Inventory row not found" });

  if (type === "ADD") row.available += quantity;
  if (type === "REMOVE") row.available = Math.max(row.available - quantity, 0);
  if (type === "DAMAGED") {
    row.available = Math.max(row.available - quantity, 0);
    row.damaged += quantity;
  }
  if (type === "TRANSFER") {
    row.available = Math.max(row.available - quantity, 0);
    row.reserved += quantity;
  }
  row.lastSync = "Live";

  writeAudit(req, `inventory ${type.toLowerCase()}`, sku);
  req.app.get("io")?.emit("inventory:updated", row);

  res.json({ data: row });
});

inventoryRouter.post("/transfer", requirePermission("inventory:write"), validateBody(inventoryAdjustmentSchema), (req: AuthRequest, res) => {
  const { sku, quantity, warehouse, toWarehouse } = req.body;
  writeAudit(req, "created transfer order", `${sku}: ${warehouse} -> ${toWarehouse}`);
  req.app.get("io")?.emit("inventory:transfer", { sku, quantity, warehouse, toWarehouse });
  res.status(201).json({
    data: {
      transferNumber: `TO-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
      sku,
      quantity,
      warehouse,
      toWarehouse,
      status: "DRAFT"
    }
  });
});
