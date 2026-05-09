import { Router } from "express";
import { z } from "zod";

import multer from "multer";

import { query, queryOne, transaction } from "../../db/pool.js";
import { requireMinimumRole, requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { adjustInventory } from "../../services/inventory.service.js";
import type { AuthRequest } from "../../types/index.js";
import { asyncHandler, ok, paginated } from "../../utils/http.js";
import { parseListQuery } from "../../utils/pagination.js";
import { dateOnly, toInteger, toNumber } from "../../utils/serializers.js";

export const inventoryRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const inventoryAdjustmentSchema = z.object({
  productId: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  sku: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
  warehouse_id: z.string().uuid().optional(),
  warehouse: z.string().optional(),
  quantity: z.coerce.number().int().positive(),
  type: z.enum(["ADD", "REMOVE", "DAMAGED", "TRANSFER", "add", "remove", "damage", "adjustment"]).default("adjustment"),
  reason: z.string().min(3),
  unitCost: z.coerce.number().nonnegative().optional(),
  unit_cost: z.coerce.number().nonnegative().optional()
});

function mapInventory(row: Record<string, unknown>) {
  const available = toInteger(row.available_quantity);
  const reorderPoint = toInteger(row.reorder_point);
  return {
    id: row.id,
    productId: row.product_id,
    product: row.product_name,
    sku: row.sku,
    category: row.category_name,
    warehouseId: row.warehouse_id,
    warehouse: row.warehouse_name,
    quantity: toInteger(row.quantity),
    available,
    reserved: toInteger(row.reserved_quantity),
    damaged: 0,
    reservedQuantity: toInteger(row.reserved_quantity),
    availableQuantity: available,
    reorderPoint,
    reorderLevel: reorderPoint,
    status: available <= reorderPoint ? "Low Stock" : "Healthy",
    batchNumber: row.batch_number,
    expiryDate: dateOnly(row.expiry_date),
    costPrice: toNumber(row.cost_price),
    stockValue: toNumber(row.stock_value),
    lastCountedAt: row.last_counted_at,
    updatedAt: row.updated_at,
    lastSync: row.updated_at
  };
}

inventoryRouter.get(
  "/",
  requirePermission("inventory:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "updated_at");
    const filters = ["p.is_active = true", "w.is_active = true"];
    const params: unknown[] = [];
    if (req.query.warehouseId) {
      params.push(req.query.warehouseId);
      filters.push(`i.warehouse_id = $${params.length}`);
    }
    if (req.query.productId) {
      params.push(req.query.productId);
      filters.push(`i.product_id = $${params.length}`);
    }
    if (req.query.categoryId) {
      params.push(req.query.categoryId);
      filters.push(`p.category_id = $${params.length}`);
    }
    if (String(req.query.lowStock ?? req.query.low_stock ?? "false") === "true") {
      filters.push("i.available_quantity <= p.reorder_point");
    }
    if (String(req.query.expiry ?? req.query.expiring ?? "false") === "true") {
      const days = Number(req.query.days ?? 30);
      filters.push(`i.expiry_date is not null and i.expiry_date <= current_date + interval '${Math.max(1, days)} days'`);
    }

    const where = `where ${filters.join(" and ")}`;
    const count = await queryOne<{ count: string }>(
      `select count(*)
         from inventory i
         join products p on p.id = i.product_id
         join warehouses w on w.id = i.warehouse_id
         left join categories c on c.id = p.category_id
        ${where}`,
      params
    );
    const rows = await query(
      `select i.*, p.sku, p.name as product_name, p.reorder_point, p.cost_price, c.name as category_name,
              w.name as warehouse_name, (i.quantity * p.cost_price) as stock_value
         from inventory i
         join products p on p.id = i.product_id
         join warehouses w on w.id = i.warehouse_id
         left join categories c on c.id = p.category_id
        ${where}
        order by i.updated_at desc
        limit $${params.length + 1} offset $${params.length + 2}`,
      [...params, list.limit, list.offset]
    );
    return paginated(res, rows.map(mapInventory), { page: list.page, limit: list.limit, total: toInteger(count?.count) });
  })
);

inventoryRouter.get(
  "/low-stock",
  requirePermission("inventory:read"),
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `select p.id as product_id, p.sku, p.name as product_name, p.reorder_point,
              coalesce(sum(i.available_quantity), 0)::int as available_quantity,
              p.reorder_quantity
         from products p
         left join inventory i on i.product_id = p.id
        where p.is_active = true
        group by p.id
       having coalesce(sum(i.available_quantity), 0) <= p.reorder_point
        order by available_quantity asc`
    );
    return ok(res, rows);
  })
);

inventoryRouter.get(
  "/expiring",
  requirePermission("inventory:read"),
  asyncHandler(async (req, res) => {
    const days = Math.max(1, Number(req.query.days ?? 30));
    const rows = await query(
      `select i.*, p.sku, p.name as product_name, p.reorder_point, p.cost_price,
              w.name as warehouse_name, (i.quantity * p.cost_price) as stock_value
         from inventory i
         join products p on p.id = i.product_id
         join warehouses w on w.id = i.warehouse_id
        where i.expiry_date is not null
          and i.expiry_date <= current_date + $1::int
        order by i.expiry_date asc`,
      [days]
    );
    return ok(res, rows.map(mapInventory));
  })
);

inventoryRouter.get(
  "/valuation",
  requirePermission("inventory:read"),
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `select w.id as warehouse_id, w.name as warehouse_name,
              p.id as product_id, p.sku, p.name as product_name,
              coalesce(sum(i.quantity), 0)::int as quantity,
              p.cost_price,
              coalesce(sum(i.quantity * p.cost_price), 0) as value
         from inventory i
         join products p on p.id = i.product_id
         join warehouses w on w.id = i.warehouse_id
        group by w.id, p.id
        order by w.name, value desc`
    );
    return ok(res, rows.map((row) => ({ ...row, quantity: toInteger(row.quantity), costPrice: toNumber(row.cost_price), value: toNumber(row.value) })));
  })
);

inventoryRouter.get(
  "/movements",
  requirePermission("inventory:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "created_at");
    const filters: string[] = [];
    const params: unknown[] = [];
    if (req.query.productId) {
      params.push(req.query.productId);
      filters.push(`sm.product_id = $${params.length}`);
    }
    if (req.query.warehouseId) {
      params.push(req.query.warehouseId);
      filters.push(`sm.warehouse_id = $${params.length}`);
    }
    if (req.query.type) {
      params.push(req.query.type);
      filters.push(`sm.movement_type = $${params.length}`);
    }
    const where = filters.length ? `where ${filters.join(" and ")}` : "";
    const count = await queryOne<{ count: string }>(`select count(*) from stock_movements sm ${where}`, params);
    const rows = await query(
      `select sm.*, p.sku, p.name as product_name, w.name as warehouse_name, u.name as created_by_name
         from stock_movements sm
         join products p on p.id = sm.product_id
         join warehouses w on w.id = sm.warehouse_id
         left join users u on u.id = sm.created_by
         ${where}
        order by sm.created_at desc
        limit $${params.length + 1} offset $${params.length + 2}`,
      [...params, list.limit, list.offset]
    );
    return paginated(res, rows, { page: list.page, limit: list.limit, total: toInteger(count?.count) });
  })
);

inventoryRouter.post(
  "/adjust",
  requireMinimumRole("staff"),
  validateBody(inventoryAdjustmentSchema),
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = req.body as z.infer<typeof inventoryAdjustmentSchema>;
    let productId = body.productId ?? body.product_id;
    if (!productId && body.sku) {
      const product = await queryOne<{ id: string }>("select id from products where sku = $1", [body.sku]);
      productId = product?.id;
    }

    let warehouseId = body.warehouseId ?? body.warehouse_id;
    if (!warehouseId && body.warehouse) {
      const warehouse = await queryOne<{ id: string }>("select id from warehouses where name = $1", [body.warehouse]);
      warehouseId = warehouse?.id;
    }

    if (!productId || !warehouseId) {
      return res.status(400).json({ success: false, message: "productId/sku and warehouseId/warehouse are required" });
    }

    const type = body.type.toLowerCase();
    const delta = type === "add" ? body.quantity : -body.quantity;
    const movementType = type === "damage" || type === "damaged" ? "damage" : "adjustment";
    const updated = await transaction((client) =>
      adjustInventory(client, {
        productId,
        warehouseId,
        quantityDelta: delta,
        movementType,
        movementQuantity: body.quantity,
        referenceType: "manual_adjustment",
        unitCost: body.unitCost ?? body.unit_cost ?? null,
        notes: body.reason,
        userId: req.user?.id ?? null,
        io: req.app.get("io")
      })
    );
    return ok(res, updated, "Inventory adjusted");
  })
);

inventoryRouter.post(
  "/import",
  requireMinimumRole("manager"),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: "CSV file is required" });
    const text = req.file.buffer.toString("utf8");
    const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
    const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());
    
    let imported = 0;
    const errors: string[] = [];

    await transaction(async (client) => {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const values = line.split(",").map((v) => v.trim());
        const row = Object.fromEntries(headers.map((h, j) => [h, values[j] ?? ""]));
        
        if (!row.sku || !row.warehouse || !row.quantity) {
          errors.push(`Row ${i + 2}: Missing required fields (sku, warehouse, quantity)`);
          continue;
        }

        const product = await client.query("select id from products where sku = $1", [row.sku]);
        if (!product.rows.length) {
          errors.push(`Row ${i + 2}: SKU not found (${row.sku})`);
          continue;
        }

        const warehouse = await client.query("select id from warehouses where name = $1", [row.warehouse]);
        if (!warehouse.rows.length) {
          errors.push(`Row ${i + 2}: Warehouse not found (${row.warehouse})`);
          continue;
        }

        const qty = Number(row.quantity);
        if (isNaN(qty) || qty <= 0) {
          errors.push(`Row ${i + 2}: Invalid quantity (${row.quantity})`);
          continue;
        }

        const type = (row.type || "add").toLowerCase();
        const delta = type === "remove" || type === "damage" ? -qty : qty;
        const movementType = type === "damage" ? "damage" : "adjustment";

        try {
          await adjustInventory(client, {
            productId: product.rows[0].id,
            warehouseId: warehouse.rows[0].id,
            quantityDelta: delta,
            movementType,
            movementQuantity: qty,
            referenceType: "csv_import",
            notes: row.reason || "Bulk CSV Import",
            userId: (req as AuthRequest).user?.id ?? null,
            io: req.app.get("io")
          });
          imported++;
        } catch (err: any) {
          errors.push(`Row ${i + 2}: ${err.message}`);
        }
      }
    });

    if (errors.length > 0 && imported === 0) {
      return res.status(400).json({ success: false, message: "Import failed", errors });
    }

    return ok(res, { imported, errors }, `Successfully imported ${imported} inventory records`);
  })
);

