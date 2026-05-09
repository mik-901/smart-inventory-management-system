import { Router } from "express";
import { z } from "zod";

import { query, queryOne } from "../../db/pool.js";
import { requireMinimumRole, requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler, created, noContent, ok, paginated } from "../../utils/http.js";
import { parseListQuery, sqlSort } from "../../utils/pagination.js";
import { toInteger, toNumber } from "../../utils/serializers.js";

export const warehousesRouter = Router();

const warehouseSchema = z.object({
  name: z.string().min(2),
  location: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().min(2),
  country: z.string().default("India"),
  capacity: z.coerce.number().int().nonnegative().default(0),
  managerId: z.string().uuid().optional().nullable(),
  manager_id: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  is_active: z.boolean().optional()
});

function mapWarehouse(row: Record<string, unknown>) {
  const id = String(row.id);
  return {
    id,
    name: row.name,
    code: String(row.name ?? "")
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 6)
      .toUpperCase(),
    location: row.location,
    address: row.address,
    city: row.city,
    country: row.country,
    capacity: toInteger(row.capacity),
    managerId: row.manager_id,
    manager: row.manager_name ?? null,
    isActive: row.is_active,
    utilization: toNumber(row.utilization),
    stockValue: toNumber(row.stock_value),
    ordersToday: toInteger(row.orders_today),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

warehousesRouter.get(
  "/",
  requirePermission("inventory:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "name");
    const filters: string[] = [];
    const params: unknown[] = [];

    if (list.search) {
      params.push(`%${list.search}%`);
      filters.push(`(w.name ilike $${params.length} or w.city ilike $${params.length} or coalesce(w.location, '') ilike $${params.length})`);
    }
    if (req.query.active != null) {
      params.push(String(req.query.active) !== "false");
      filters.push(`w.is_active = $${params.length}`);
    }

    const where = filters.length ? `where ${filters.join(" and ")}` : "";
    const orderBy = sqlSort(list.sort, list.order, { name: "w.name", city: "w.city", capacity: "w.capacity", created_at: "w.created_at" }, "name");
    const count = await queryOne<{ count: string }>(`select count(*) from warehouses w ${where}`, params);
    const rows = await query(
      `select w.*, u.name as manager_name,
              case when w.capacity = 0 then 0 else round(coalesce(sum(i.quantity), 0) * 100.0 / w.capacity, 2) end as utilization,
              coalesce(sum(i.quantity * p.cost_price), 0) as stock_value,
              (select count(*) from sales_orders so where so.warehouse_id = w.id and so.order_date = current_date) as orders_today
         from warehouses w
         left join users u on u.id = w.manager_id
         left join inventory i on i.warehouse_id = w.id
         left join products p on p.id = i.product_id
         ${where}
        group by w.id, u.name
        order by ${orderBy}
        limit $${params.length + 1} offset $${params.length + 2}`,
      [...params, list.limit, list.offset]
    );

    return paginated(res, rows.map(mapWarehouse), { page: list.page, limit: list.limit, total: toInteger(count?.count) });
  })
);

warehousesRouter.post(
  "/",
  requireMinimumRole("staff"),
  validateBody(warehouseSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof warehouseSchema>;
    const row = await queryOne(
      `insert into warehouses (name, location, address, city, country, capacity, manager_id, is_active)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning *`,
      [
        body.name,
        body.location ?? null,
        body.address ?? null,
        body.city,
        body.country,
        body.capacity,
        body.managerId ?? body.manager_id ?? null,
        body.isActive ?? body.is_active ?? true
      ]
    );
    return created(res, mapWarehouse(row ?? {}), "Warehouse created");
  })
);

warehousesRouter.get(
  "/:id",
  requirePermission("inventory:read"),
  asyncHandler(async (req, res) => {
    const row = await queryOne(
      `select w.*, u.name as manager_name,
              case when w.capacity = 0 then 0 else round(coalesce(sum(i.quantity), 0) * 100.0 / w.capacity, 2) end as utilization,
              coalesce(sum(i.quantity * p.cost_price), 0) as stock_value,
              coalesce(sum(i.quantity), 0)::int as total_quantity,
              coalesce(sum(i.reserved_quantity), 0)::int as reserved_quantity,
              coalesce(sum(i.available_quantity), 0)::int as available_quantity
         from warehouses w
         left join users u on u.id = w.manager_id
         left join inventory i on i.warehouse_id = w.id
         left join products p on p.id = i.product_id
        where w.id = $1
        group by w.id, u.name`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ success: false, message: "Warehouse not found" });
    return ok(res, {
      ...mapWarehouse(row),
      stockSummary: {
        totalQuantity: toInteger(row.total_quantity),
        reservedQuantity: toInteger(row.reserved_quantity),
        availableQuantity: toInteger(row.available_quantity),
        stockValue: toNumber(row.stock_value)
      }
    });
  })
);

warehousesRouter.put(
  "/:id",
  requireMinimumRole("staff"),
  validateBody(warehouseSchema.partial()),
  asyncHandler(async (req, res) => {
    const body = req.body as Partial<z.infer<typeof warehouseSchema>>;
    const row = await queryOne(
      `update warehouses
          set name = coalesce($2, name),
              location = coalesce($3, location),
              address = coalesce($4, address),
              city = coalesce($5, city),
              country = coalesce($6, country),
              capacity = coalesce($7, capacity),
              manager_id = coalesce($8, manager_id),
              is_active = coalesce($9, is_active)
        where id = $1
        returning *`,
      [
        req.params.id,
        body.name ?? null,
        body.location ?? null,
        body.address ?? null,
        body.city ?? null,
        body.country ?? null,
        body.capacity ?? null,
        body.managerId ?? body.manager_id ?? null,
        body.isActive ?? body.is_active ?? null
      ]
    );
    if (!row) return res.status(404).json({ success: false, message: "Warehouse not found" });
    return ok(res, mapWarehouse(row), "Warehouse updated");
  })
);

warehousesRouter.delete(
  "/:id",
  requireMinimumRole("staff"),
  asyncHandler(async (req, res) => {
    await query("update warehouses set is_active = false where id = $1", [req.params.id]);
    return noContent(res);
  })
);

warehousesRouter.get(
  "/:id/inventory",
  requirePermission("inventory:read"),
  asyncHandler(async (req, res) => {
    const rows = await query(
      `select i.*, p.sku, p.name as product_name, p.reorder_point, p.cost_price, p.selling_price,
              c.name as category_name
         from inventory i
         join products p on p.id = i.product_id
         left join categories c on c.id = p.category_id
        where i.warehouse_id = $1
        order by p.name`,
      [req.params.id]
    );
    return ok(
      res,
      rows.map((row) => ({
        id: row.id,
        productId: row.product_id,
        product: row.product_name,
        sku: row.sku,
        category: row.category_name,
        quantity: toInteger(row.quantity),
        reserved: toInteger(row.reserved_quantity),
        available: toInteger(row.available_quantity),
        reorderPoint: toInteger(row.reorder_point),
        costPrice: toNumber(row.cost_price),
        sellingPrice: toNumber(row.selling_price),
        batchNumber: row.batch_number,
        expiryDate: row.expiry_date,
        updatedAt: row.updated_at
      }))
    );
  })
);
