import { Router } from "express";

import { demoStore } from "../../data/demo-store.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { inventoryAdjustmentSchema } from "../../validators/schemas.js";
import { writeAudit } from "../../utils/audit.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { pool, query } from "../../db/pool.js";

export const inventoryRouter = Router();

inventoryRouter.get("/", requirePermission("inventory:read"), async (_req, res) => {
  if (pool) {
    try {
      const rows = await query(`
        SELECT i.id, p.name as product, p.sku, w.name as warehouse, 
               i.quantity as available, i.reserved_quantity as reserved, 
               i.damaged_quantity as damaged, p.reorder_level,
               i.updated_at
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        JOIN warehouses w ON i.warehouse_id = w.id
        ORDER BY i.updated_at DESC
      `);
      return res.json({ 
        data: rows.map(r => ({
          ...r,
          lastSync: new Date(r.updated_at).toISOString()
        }))
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch inventory" });
    }
  }
  res.json({ data: demoStore.inventory });
});

inventoryRouter.post("/adjust", requirePermission("inventory:write"), validateBody(inventoryAdjustmentSchema), async (req: AuthRequest, res) => {
  const { sku, quantity, type, warehouse } = req.body;
  
  if (pool) {
    try {
      const pRows = await query("SELECT id FROM products WHERE sku = $1", [sku]);
      const wRows = await query("SELECT id FROM warehouses WHERE name = $1", [warehouse || "Mumbai Central Hub"]);
      
      if (pRows.length === 0 || wRows.length === 0) {
        return res.status(404).json({ error: "Product or warehouse not found" });
      }
      const productId = pRows[0].id;
      const warehouseId = wRows[0].id;

      // Ensure row exists
      await query(`
        INSERT INTO inventory (product_id, warehouse_id, quantity)
        VALUES ($1, $2, 0)
        ON CONFLICT (product_id, warehouse_id) DO NOTHING
      `, [productId, warehouseId]);

      let updateSql = "";
      if (type === "ADD") updateSql = "quantity = quantity + $1";
      if (type === "REMOVE") updateSql = "quantity = GREATEST(quantity - $1, 0)";
      if (type === "DAMAGED") updateSql = "quantity = GREATEST(quantity - $1, 0), damaged_quantity = damaged_quantity + $1";
      if (type === "TRANSFER") updateSql = "quantity = GREATEST(quantity - $1, 0), reserved_quantity = reserved_quantity + $1";

      const rows = await query(`
        UPDATE inventory SET ${updateSql}, updated_at = now()
        WHERE product_id = $2 AND warehouse_id = $3
        RETURNING *
      `, [quantity, productId, warehouseId]);

      writeAudit(req, `inventory ${type.toLowerCase()}`, sku);
      const updatedRow = { sku, available: rows[0].quantity, reserved: rows[0].reserved_quantity, damaged: rows[0].damaged_quantity };
      req.app.get("io")?.emit("inventory:updated", updatedRow);

      return res.json({ data: updatedRow });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to adjust inventory" });
    }
  }

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

inventoryRouter.post("/transfer", requirePermission("inventory:write"), validateBody(inventoryAdjustmentSchema), async (req: AuthRequest, res) => {
  const { sku, quantity, warehouse, toWarehouse } = req.body;
  writeAudit(req, "created transfer order", `${sku}: ${warehouse} -> ${toWarehouse}`);
  req.app.get("io")?.emit("inventory:transfer", { sku, quantity, warehouse, toWarehouse });
  
  if (pool) {
    // Basic transfer order stub
    const num = `TO-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    return res.status(201).json({
      data: { transferNumber: num, sku, quantity, warehouse, toWarehouse, status: "DRAFT" }
    });
  }

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
