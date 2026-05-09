import { Router } from "express";
import { z } from "zod";

import { query, queryOne, transaction } from "../../db/pool.js";
import { requireMinimumRole, requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { adjustInventory } from "../../services/inventory.service.js";
import type { AuthRequest } from "../../types/index.js";
import { asyncHandler, created, noContent, ok } from "../../utils/http.js";
import { dateOnly, toNumber } from "../../utils/serializers.js";

export const ordersRouter = Router();

const legacyOrderSchema = z.object({
  type: z.enum(["Purchase", "Sales", "Transfer"]),
  party: z.string().optional(),
  warehouse: z.string().min(2),
  product: z.string().optional(),
  quantity: z.coerce.number().int().positive().default(1)
});

function legacyNumber(prefix: string) {
  return `${prefix}-${new Date().getFullYear()}-${Math.floor(Date.now() % 900000)}`;
}

ordersRouter.get(
  "/",
  requirePermission("orders:read"),
  asyncHandler(async (req, res) => {
    const type = String(req.query.type ?? "All");
    const rows = await query(
      `select id, po_number as number, 'Purchase' as type, status::text, s.name as party, w.name as warehouse, total_amount as amount, order_date as date
         from purchase_orders po
         join suppliers s on s.id = po.supplier_id
         join warehouses w on w.id = po.warehouse_id
       union all
       select id, so_number as number, 'Sales' as type, status::text, customer_name as party, w.name as warehouse, total_amount as amount, order_date as date
         from sales_orders so
         join warehouses w on w.id = so.warehouse_id
       union all
       select t.id, transfer_number as number, 'Transfer' as type, status::text, 'Internal transfer' as party,
              fw.name || ' -> ' || tw.name as warehouse, 0::numeric as amount, transfer_date as date
         from transfers t
         join warehouses fw on fw.id = t.from_warehouse_id
         join warehouses tw on tw.id = t.to_warehouse_id
       order by date desc`
    );
    const filtered = type === "All" ? rows : rows.filter((row) => row.type === type);
    return ok(
      res,
      filtered.map((row) => ({
        ...row,
        amount: toNumber(row.amount),
        date: dateOnly(row.date),
        status: String(row.status).slice(0, 1).toUpperCase() + String(row.status).slice(1)
      }))
    );
  })
);

ordersRouter.post(
  "/",
  requireMinimumRole("staff"),
  validateBody(legacyOrderSchema),
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = req.body as z.infer<typeof legacyOrderSchema>;
    const warehouse = await queryOne<{ id: string; name: string }>("select id, name from warehouses where name = $1 or id::text = $1", [body.warehouse]);
    if (!warehouse) return res.status(404).json({ success: false, message: "Warehouse not found" });
    const product = body.product
      ? await queryOne<{ id: string; selling_price: string; cost_price: string; name: string }>("select id, selling_price, cost_price, name from products where name = $1 or sku = $1 or id::text = $1", [body.product])
      : null;

    if (body.type === "Transfer") {
      return res.status(422).json({ success: false, message: "Use /transfers for stock transfers so source and destination warehouses are explicit" });
    }
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const result = await transaction(async (client) => {
      if (body.type === "Purchase") {
        const supplier = await client.query("select id, name from suppliers where name = $1", [body.party ?? "Walk-in Supplier"]);
        const supplierId = supplier.rows[0]?.id ?? (await client.query("insert into suppliers (name) values ($1) returning id", [body.party ?? "Walk-in Supplier"])).rows[0].id;
        const total = body.quantity * Number(product.cost_price);
        const po = await client.query(
          `insert into purchase_orders (po_number, supplier_id, warehouse_id, status, total_amount, created_by)
           values ($1, $2, $3, 'draft', $4, $5)
           returning id, po_number as number, 'Purchase' as type, status::text, $6::text as party, $7::text as warehouse, total_amount as amount, order_date as date`,
          [legacyNumber("PO"), supplierId, warehouse.id, total, req.user?.id ?? null, body.party ?? "Walk-in Supplier", warehouse.name]
        );
        await client.query("insert into purchase_order_items (po_id, product_id, quantity_ordered, unit_cost) values ($1, $2, $3, $4)", [po.rows[0].id, product.id, body.quantity, Number(product.cost_price)]);
        return po.rows[0];
      }

      const total = body.quantity * Number(product.selling_price);
      const so = await client.query(
        `insert into sales_orders (so_number, customer_name, warehouse_id, status, total_amount, created_by)
         values ($1, $2, $3, 'draft', $4, $5)
         returning id, so_number as number, 'Sales' as type, status::text, customer_name as party, $6::text as warehouse, total_amount as amount, order_date as date`,
        [legacyNumber("SO"), body.party ?? "Walk-in Customer", warehouse.id, total, req.user?.id ?? null, warehouse.name]
      );
      await client.query("insert into sales_order_items (so_id, product_id, quantity, unit_price) values ($1, $2, $3, $4)", [so.rows[0].id, product.id, body.quantity, Number(product.selling_price)]);
      await adjustInventory(client, {
        productId: product.id,
        warehouseId: warehouse.id,
        reservedDelta: body.quantity,
        userId: req.user?.id ?? null,
        io: req.app.get("io")
      });
      return so.rows[0];
    });

    req.app.get("io")?.emit("order:new", { id: result.id, type: body.type });
    return created(res, { ...result, amount: toNumber(result.amount), date: dateOnly(result.date) }, "Order created");
  })
);

ordersRouter.patch(
  "/:id/status",
  requireMinimumRole("staff"),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const status = String(req.body.status ?? "");
    const lower = status.toLowerCase();
    if (id.startsWith("PO") || String(req.body.type) === "Purchase") {
      const mapped = lower === "approved" ? "confirmed" : lower === "received" ? "received" : lower === "cancelled" ? "cancelled" : "sent";
      const row = await queryOne("update purchase_orders set status = $2 where po_number = $1 or id::text = $1 returning id, po_number as number, 'Purchase' as type, status::text", [id, mapped]);
      if (!row) return res.status(404).json({ success: false, message: "Order not found" });
      return ok(res, row, "Order status updated");
    }
    const mapped = lower === "approved" ? "confirmed" : lower === "dispatched" ? "shipped" : lower === "received" ? "delivered" : lower === "cancelled" ? "cancelled" : lower;
    const row = await queryOne("update sales_orders set status = $2 where so_number = $1 or id::text = $1 returning id, so_number as number, 'Sales' as type, status::text", [id, mapped]);
    if (!row) return res.status(404).json({ success: false, message: "Order not found" });
    return ok(res, row, "Order status updated");
  })
);

ordersRouter.delete(
  "/:id",
  requireMinimumRole("staff"),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    await query("update purchase_orders set status = 'cancelled' where po_number = $1 or id::text = $1", [id]);
    await query("update sales_orders set status = 'cancelled' where so_number = $1 or id::text = $1", [id]);
    await query("update transfers set status = 'cancelled' where transfer_number = $1 or id::text = $1", [id]);
    return noContent(res);
  })
);
