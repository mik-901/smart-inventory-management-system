import { Router } from "express";

import { demoStore } from "../../data/demo-store.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { orderSchema } from "../../validators/schemas.js";
import { writeAudit } from "../../utils/audit.js";
import type { AuthRequest } from "../../middleware/auth.js";

export const ordersRouter = Router();

ordersRouter.get("/", requirePermission("orders:read"), (req, res) => {
  const type = String(req.query.type ?? "");
  const data = type ? demoStore.orders.filter((order) => order.type === type) : demoStore.orders;
  res.json({ data });
});

ordersRouter.post("/", requirePermission("orders:write"), validateBody(orderSchema), (req: AuthRequest, res) => {
  const prefix = req.body.type === "Purchase" ? "PO" : req.body.type === "Sales" ? "SO" : "TO";
  const order = {
    id: crypto.randomUUID(),
    number: `${prefix}-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    status: "Draft",
    date: new Date().toISOString().slice(0, 10),
    ...req.body
  };
  demoStore.orders.unshift(order);
  writeAudit(req, "created order", order.number);
  req.app.get("io")?.emit("orders:created", order);
  res.status(201).json({ data: order });
});

ordersRouter.patch("/:id/status", requirePermission("orders:write"), (req: AuthRequest, res) => {
  const order = demoStore.orders.find((item) => item.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  order.status = req.body.status ?? order.status;
  writeAudit(req, "updated order status", order.number);
  req.app.get("io")?.emit("orders:status", order);
  res.json({ data: order });
});
