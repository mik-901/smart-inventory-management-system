import { Router } from "express";

import { demoStore } from "../../data/demo-store.js";
import { requirePermission } from "../../middleware/rbac.js";
import { pool, query } from "../../db/pool.js";
import crypto from "node:crypto";

export const warehousesRouter = Router();

warehousesRouter.get("/", requirePermission("inventory:read"), async (_req, res) => {
  if (pool) {
    try {
      const rows = await query(`
        SELECT 
          w.id, w.name, w.code, w.city, 'Manager' as manager, 
          w.capacity, w.utilization, 
          (SELECT COALESCE(SUM(i.quantity * p.cost_price), 0) FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.warehouse_id = w.id) as "stockValue",
          0 as "ordersToday"
        FROM warehouses w
        ORDER BY w.name ASC
      `);
      return res.json({ 
        data: rows.map(r => ({
          ...r,
          stockValue: parseFloat(r.stockValue),
          ordersToday: parseInt(r.ordersToday)
        }))
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch warehouses" });
    }
  }
  res.json({ data: demoStore.warehouses });
});

warehousesRouter.post("/", requirePermission("inventory:write"), async (req, res) => {
  if (pool) {
    try {
      const { name, code, city } = req.body;
      const rows = await query(`
        INSERT INTO warehouses (name, code, city, capacity, utilization)
        VALUES ($1, $2, $3, 10000, 0)
        RETURNING *
      `, [name, code, city]);
      const w = rows[0];
      return res.status(201).json({ 
        data: { ...w, stockValue: 0, ordersToday: 0, manager: "Manager" }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create warehouse" });
    }
  }

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
