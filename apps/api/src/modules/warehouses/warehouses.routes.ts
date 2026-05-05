import { Router } from "express";

import { demoStore } from "../../data/demo-store.js";
import { requirePermission } from "../../middleware/rbac.js";

export const warehousesRouter = Router();

warehousesRouter.get("/", requirePermission("inventory:read"), (_req, res) => {
  res.json({ data: demoStore.warehouses });
});

warehousesRouter.post("/", requirePermission("inventory:write"), (req, res) => {
  const warehouse = {
    id: crypto.randomUUID(),
    utilization: 0,
    stockValue: 0,
    ordersToday: 0,
    ...req.body
  };
  demoStore.warehouses.push(warehouse);
  res.status(201).json({ data: warehouse });
});
