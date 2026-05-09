import { Router } from "express";
import { z } from "zod";

import { query, queryOne, transaction } from "../../db/pool.js";
import { requireMinimumRole, requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { adjustInventory } from "../../services/inventory.service.js";
import type { AuthRequest } from "../../types/index.js";
import { asyncHandler, created, ok, paginated } from "../../utils/http.js";
import { parseListQuery } from "../../utils/pagination.js";
import { dateOnly, toInteger, toNumber } from "../../utils/serializers.js";

export const salesOrdersRouter = Router();

const soItemSchema = z.object({
  productId: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative().optional(),
  unit_price: z.coerce.number().nonnegative().optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  discount_percent: z.coerce.number().min(0).max(100).optional()
});

const soCreateSchema = z.object({
  customerName: z.string().min(2).optional(),
  customer_name: z.string().min(2).optional(),
  customerEmail: z.string().email().optional().nullable(),
  customer_email: z.string().email().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  customer_phone: z.string().optional().nullable(),
  warehouseId: z.string().uuid().optional(),
  warehouse_id: z.string().uuid().optional(),
  notes: z.string().optional().nullable(),
  items: z.array(soItemSchema).min(1)
});

function orderNumber(prefix: string) {
  return `${prefix}-${new Date().getFullYear()}-${Math.floor(Date.now() % 900000)}`;
}

function mapSo(row: Record<string, unknown>) {
  return {
    id: row.id,
    soNumber: row.so_number,
    number: row.so_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    warehouseId: row.warehouse_id,
    warehouse: row.warehouse_name,
    status: row.status,
    orderDate: dateOnly(row.order_date),
    shippedDate: dateOnly(row.shipped_date),
    deliveredDate: dateOnly(row.delivered_date),
    trackingNumber: row.tracking_number,
    carrierName: row.carrier_name,
    totalAmount: toNumber(row.total_amount),
    amount: toNumber(row.total_amount),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function shipOrder(req: AuthRequest, id: string, trackingNumber?: string, carrierName?: string) {
  return transaction(async (client) => {
    const order = await client.query("select * from sales_orders where id = $1 for update", [id]);
    if (order.rowCount !== 1) throw new Error("Sales order not found");
    if (["shipped", "delivered", "cancelled"].includes(order.rows[0].status)) return order.rows[0];

    const items = await client.query("select * from sales_order_items where so_id = $1", [id]);
    for (const item of items.rows) {
      await adjustInventory(client, {
        productId: item.product_id,
        warehouseId: order.rows[0].warehouse_id,
        quantityDelta: -Number(item.quantity),
        reservedDelta: -Number(item.quantity),
        movementType: "sale",
        movementQuantity: Number(item.quantity),
        referenceId: id,
        referenceType: "sales_order",
        unitCost: Number(item.unit_price),
        notes: `Shipped ${order.rows[0].so_number}`,
        userId: req.user?.id ?? null,
        io: req.app.get("io")
      });
    }
    const updated = await client.query(
      `update sales_orders
          set status = 'shipped',
              shipped_date = current_date,
              tracking_number = coalesce($2, tracking_number),
              carrier_name = coalesce($3, carrier_name)
        where id = $1
        returning *`,
      [id, trackingNumber ?? null, carrierName ?? null]
    );
    req.app.get("io")?.emit("order:updated", { type: "sales_order", id, status: "shipped" });
    return updated.rows[0];
  });
}

salesOrdersRouter.get(
  "/",
  requirePermission("orders:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "order_date");
    const filters: string[] = [];
    const params: unknown[] = [];
    if (req.query.status) {
      params.push(req.query.status);
      filters.push(`so.status = $${params.length}`);
    }
    if (req.query.from) {
      params.push(req.query.from);
      filters.push(`so.order_date >= $${params.length}`);
    }
    if (req.query.to) {
      params.push(req.query.to);
      filters.push(`so.order_date <= $${params.length}`);
    }
    const where = filters.length ? `where ${filters.join(" and ")}` : "";
    const count = await queryOne<{ count: string }>(`select count(*) from sales_orders so ${where}`, params);
    const rows = await query(
      `select so.*, w.name as warehouse_name
         from sales_orders so
         join warehouses w on w.id = so.warehouse_id
         ${where}
        order by so.order_date desc, so.created_at desc
        limit $${params.length + 1} offset $${params.length + 2}`,
      [...params, list.limit, list.offset]
    );
    return paginated(res, rows.map(mapSo), { page: list.page, limit: list.limit, total: toInteger(count?.count) });
  })
);

salesOrdersRouter.post(
  "/",
  requireMinimumRole("staff"),
  validateBody(soCreateSchema),
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = req.body as z.infer<typeof soCreateSchema>;
    const warehouseId = body.warehouseId ?? body.warehouse_id;
    const customerName = body.customerName ?? body.customer_name;
    if (!warehouseId || !customerName) return res.status(400).json({ success: false, message: "customerName and warehouseId are required" });

    const createdOrder = await transaction(async (client) => {
      let total = 0;
      const normalizedItems = [];
      for (const item of body.items) {
        const productId = item.productId ?? item.product_id;
        if (!productId) throw new Error("Each item needs productId");
        const unitPrice = item.unitPrice ?? item.unit_price;
        const product = await client.query("select selling_price from products where id = $1", [productId]);
        const price = unitPrice ?? Number(product.rows[0]?.selling_price ?? 0);
        const discount = item.discountPercent ?? item.discount_percent ?? 0;
        total += item.quantity * price * (1 - discount / 100);
        normalizedItems.push({ productId, quantity: item.quantity, unitPrice: price, discount });

        const available = await client.query(
          `select coalesce(sum(available_quantity), 0)::int as available
             from inventory where product_id = $1 and warehouse_id = $2`,
          [productId, warehouseId]
        );
        if (Number(available.rows[0]?.available ?? 0) < item.quantity) throw new Error("Insufficient stock for one or more items");
      }

      const so = await client.query(
        `insert into sales_orders (so_number, customer_name, customer_email, customer_phone, warehouse_id, status, total_amount, notes, created_by)
         values ($1, $2, $3, $4, $5, 'draft', $6, $7, $8)
         returning *`,
        [
          orderNumber("SO"),
          customerName,
          body.customerEmail ?? body.customer_email ?? null,
          body.customerPhone ?? body.customer_phone ?? null,
          warehouseId,
          total,
          body.notes ?? null,
          req.user?.id ?? null
        ]
      );

      for (const item of normalizedItems) {
        await client.query(
          `insert into sales_order_items (so_id, product_id, quantity, unit_price, discount_percent)
           values ($1, $2, $3, $4, $5)`,
          [so.rows[0].id, item.productId, item.quantity, item.unitPrice, item.discount]
        );
        await adjustInventory(client, {
          productId: item.productId,
          warehouseId,
          reservedDelta: item.quantity,
          userId: req.user?.id ?? null,
          io: req.app.get("io")
        });
      }

      return so.rows[0];
    });

    req.app.get("io")?.emit("order:new", { type: "sales_order", id: createdOrder.id });
    return created(res, mapSo(createdOrder), "Sales order created");
  })
);

salesOrdersRouter.get(
  "/:id",
  requirePermission("orders:read"),
  asyncHandler(async (req, res) => {
    const order = await queryOne(
      `select so.*, w.name as warehouse_name
         from sales_orders so
         join warehouses w on w.id = so.warehouse_id
        where so.id::text = $1 or so.so_number = $1`,
      [req.params.id]
    );
    if (!order) return res.status(404).json({ success: false, message: "Sales order not found" });
    const items = await query(
      `select soi.*, p.sku, p.name as product_name
         from sales_order_items soi
         join products p on p.id = soi.product_id
        where soi.so_id = $1`,
      [order.id]
    );
    return ok(res, { ...mapSo(order), items });
  })
);

salesOrdersRouter.patch(
  "/:id/status",
  requireMinimumRole("staff"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const status = String(req.body.status ?? "");
    if (!["confirmed", "shipped", "delivered", "cancelled"].includes(status)) {
      return res.status(422).json({ success: false, message: "Invalid sales order status" });
    }

    const orderId = String(req.params.id);
    if (status === "shipped") {
      const shipped = await shipOrder(req, orderId, req.body.trackingNumber, req.body.carrierName);
      return ok(res, mapSo(shipped), "Sales order shipped");
    }

    const updated = await transaction(async (client) => {
      const order = await client.query("select * from sales_orders where id = $1 for update", [orderId]);
      if (order.rowCount !== 1) throw new Error("Sales order not found");

      if (status === "cancelled" && !["shipped", "delivered", "cancelled"].includes(order.rows[0].status)) {
        const items = await client.query("select * from sales_order_items where so_id = $1", [orderId]);
        for (const item of items.rows) {
          await adjustInventory(client, {
            productId: item.product_id,
            warehouseId: order.rows[0].warehouse_id,
            reservedDelta: -Number(item.quantity),
            userId: req.user?.id ?? null,
            io: req.app.get("io")
          });
        }
      }

      const row = await client.query(
        `update sales_orders
            set status = $2,
                delivered_date = case when $2 = 'delivered' then current_date else delivered_date end
          where id = $1
          returning *`,
        [orderId, status]
      );
      return row.rows[0];
    });
    req.app.get("io")?.emit("order:updated", { type: "sales_order", id: orderId, status });
    return ok(res, mapSo(updated), "Sales order status updated");
  })
);

salesOrdersRouter.patch(
  "/:id/ship",
  requireMinimumRole("staff"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const shipped = await shipOrder(req, String(req.params.id), req.body.trackingNumber ?? req.body.tracking_number, req.body.carrierName ?? req.body.carrier_name);
    return ok(res, mapSo(shipped), "Sales order shipped");
  })
);
