import { Router } from "express";

import { demoStore } from "../../data/demo-store.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { orderSchema } from "../../validators/schemas.js";
import { writeAudit } from "../../utils/audit.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { pool, query } from "../../db/pool.js";

export const ordersRouter = Router();

ordersRouter.get("/", requirePermission("orders:read"), async (req, res) => {
  const type = String(req.query.type ?? "Purchase");
  
  if (pool) {
    try {
      const dbType = type.toUpperCase();
      const rows = await query("SELECT * FROM orders WHERE type = $1 ORDER BY created_at DESC", [dbType]);
      return res.json({ 
        data: rows.map(r => ({
          ...r,
          id: r.order_number || r.id, // demo uses string ids like PO-2026-1001
          date: new Date(r.created_at).toISOString().split('T')[0],
          total: parseFloat(r.total_amount)
        }))
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch orders" });
    }
  }

  const data = demoStore.orders.filter((order) => order.type === type);
  res.json({ data });
});

ordersRouter.post("/", requirePermission("orders:write"), validateBody(orderSchema), async (req: AuthRequest, res) => {
  const { type, supplier, customer, items, total, status } = req.body;
  
  if (pool) {
    try {
      const prefix = type === "Purchase" ? "PO" : type === "Sales" ? "SO" : "TO";
      const orderNum = `${prefix}-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;
      
      const rows = await query(`
        INSERT INTO orders (order_number, type, status, supplier, customer, items, total_amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [orderNum, type.toUpperCase(), status || "DRAFT", supplier, customer, items?.length || 0, total]);
      
      const order = rows[0];
      writeAudit(req, `created ${type.toLowerCase()} order`, order.order_number);
      
      return res.status(201).json({
        data: {
          ...order,
          id: order.order_number,
          date: new Date(order.created_at).toISOString().split('T')[0],
          total: parseFloat(order.total_amount)
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create order" });
    }
  }

  const prefix = type === "Purchase" ? "PO" : type === "Sales" ? "SO" : "TO";
  const order = {
    id: `${prefix}-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    date: new Date().toISOString().split("T")[0],
    ...req.body,
    items: req.body.items.length
  };

  demoStore.orders.unshift(order);
  writeAudit(req, `created ${type.toLowerCase()} order`, order.id);
  res.status(201).json({ data: order });
});

ordersRouter.patch("/:id/status", requirePermission("orders:write"), async (req: AuthRequest, res) => {
  const { status } = req.body;
  
  if (pool) {
    try {
      const rows = await query("UPDATE orders SET status = $1, updated_at = now() WHERE order_number = $2 RETURNING order_number", [status, req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: "Order not found" });
      
      writeAudit(req, `updated order status to ${status}`, req.params.id as string);
      return res.json({ data: { id: req.params.id, status } });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to update order status" });
    }
  }

  const order = demoStore.orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  order.status = status;
  writeAudit(req, `updated order status to ${status}`, order.id);
  res.json({ data: order });
});
