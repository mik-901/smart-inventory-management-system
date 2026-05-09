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

export const purchaseOrdersRouter = Router();

const poItemSchema = z.object({
  productId: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  quantityOrdered: z.coerce.number().int().positive().optional(),
  quantity_ordered: z.coerce.number().int().positive().optional(),
  quantity: z.coerce.number().int().positive().optional(),
  unitCost: z.coerce.number().nonnegative().optional(),
  unit_cost: z.coerce.number().nonnegative().optional()
});

const poCreateSchema = z.object({
  supplierId: z.string().uuid().optional(),
  supplier_id: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  warehouse_id: z.string().uuid().optional(),
  expectedDate: z.string().optional().nullable(),
  expected_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(poItemSchema).min(1)
});

const poUpdateSchema = poCreateSchema.omit({ items: true }).partial().extend({
  status: z.enum(["draft", "sent", "confirmed", "received", "cancelled"]).optional()
});

const receiveSchema = z.object({
  items: z.array(
    z.object({
      itemId: z.string().uuid().optional(),
      id: z.string().uuid().optional(),
      productId: z.string().uuid().optional(),
      product_id: z.string().uuid().optional(),
      quantityReceived: z.coerce.number().int().nonnegative().optional(),
      quantity_received: z.coerce.number().int().nonnegative().optional()
    })
  )
});

function orderNumber(prefix: string) {
  return `${prefix}-${new Date().getFullYear()}-${Math.floor(Date.now() % 900000)}`;
}

function mapPo(row: Record<string, unknown>) {
  return {
    id: row.id,
    poNumber: row.po_number,
    number: row.po_number,
    supplierId: row.supplier_id,
    supplier: row.supplier_name,
    warehouseId: row.warehouse_id,
    warehouse: row.warehouse_name,
    status: row.status,
    orderDate: dateOnly(row.order_date),
    expectedDate: dateOnly(row.expected_date),
    receivedDate: dateOnly(row.received_date),
    totalAmount: toNumber(row.total_amount),
    amount: toNumber(row.total_amount),
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

purchaseOrdersRouter.get(
  "/",
  requirePermission("orders:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "order_date");
    const filters: string[] = [];
    const params: unknown[] = [];
    if (req.query.status) {
      params.push(req.query.status);
      filters.push(`po.status = $${params.length}`);
    }
    if (req.query.supplierId) {
      params.push(req.query.supplierId);
      filters.push(`po.supplier_id = $${params.length}`);
    }
    if (req.query.from) {
      params.push(req.query.from);
      filters.push(`po.order_date >= $${params.length}`);
    }
    if (req.query.to) {
      params.push(req.query.to);
      filters.push(`po.order_date <= $${params.length}`);
    }
    const where = filters.length ? `where ${filters.join(" and ")}` : "";
    const count = await queryOne<{ count: string }>(`select count(*) from purchase_orders po ${where}`, params);
    const rows = await query(
      `select po.*, s.name as supplier_name, w.name as warehouse_name
         from purchase_orders po
         join suppliers s on s.id = po.supplier_id
         join warehouses w on w.id = po.warehouse_id
         ${where}
        order by po.order_date desc, po.created_at desc
        limit $${params.length + 1} offset $${params.length + 2}`,
      [...params, list.limit, list.offset]
    );
    return paginated(res, rows.map(mapPo), { page: list.page, limit: list.limit, total: toInteger(count?.count) });
  })
);

purchaseOrdersRouter.post(
  "/",
  requireMinimumRole("staff"),
  validateBody(poCreateSchema),
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = req.body as z.infer<typeof poCreateSchema>;
    const supplierId = body.supplierId ?? body.supplier_id;
    const warehouseId = body.warehouseId ?? body.warehouse_id;
    if (!supplierId || !warehouseId) return res.status(400).json({ success: false, message: "supplierId and warehouseId are required" });

    const createdOrder = await transaction(async (client) => {
      let total = 0;
      const normalizedItems = body.items.map((item) => {
        const productId = item.productId ?? item.product_id;
        const quantity = item.quantityOrdered ?? item.quantity_ordered ?? item.quantity;
        const unitCost = item.unitCost ?? item.unit_cost;
        if (!productId || !quantity || unitCost == null) throw new Error("Each item needs productId, quantity, and unitCost");
        total += quantity * unitCost;
        return { productId, quantity, unitCost };
      });

      const po = await client.query(
        `insert into purchase_orders (po_number, supplier_id, warehouse_id, status, expected_date, total_amount, notes, created_by)
         values ($1, $2, $3, 'draft', $4, $5, $6, $7)
         returning *`,
        [orderNumber("PO"), supplierId, warehouseId, body.expectedDate ?? body.expected_date ?? null, total, body.notes ?? null, req.user?.id ?? null]
      );

      for (const item of normalizedItems) {
        await client.query(
          `insert into purchase_order_items (po_id, product_id, quantity_ordered, unit_cost)
           values ($1, $2, $3, $4)`,
          [po.rows[0].id, item.productId, item.quantity, item.unitCost]
        );
      }

      return po.rows[0];
    });

    return created(res, mapPo(createdOrder), "Purchase order created");
  })
);

purchaseOrdersRouter.get(
  "/:id",
  requirePermission("orders:read"),
  asyncHandler(async (req, res) => {
    const po = await queryOne(
      `select po.*, s.name as supplier_name, w.name as warehouse_name
         from purchase_orders po
         join suppliers s on s.id = po.supplier_id
         join warehouses w on w.id = po.warehouse_id
        where po.id::text = $1 or po.po_number = $1`,
      [req.params.id]
    );
    if (!po) return res.status(404).json({ success: false, message: "Purchase order not found" });
    const items = await query(
      `select poi.*, p.sku, p.name as product_name
         from purchase_order_items poi
         join products p on p.id = poi.product_id
        where poi.po_id = $1
        order by p.name`,
      [po.id]
    );
    return ok(res, { ...mapPo(po), items });
  })
);

purchaseOrdersRouter.put(
  "/:id",
  requireMinimumRole("staff"),
  validateBody(poUpdateSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof poUpdateSchema>;
    const row = await queryOne(
      `update purchase_orders
          set supplier_id = coalesce($2, supplier_id),
              warehouse_id = coalesce($3, warehouse_id),
              expected_date = coalesce($4, expected_date),
              notes = coalesce($5, notes)
        where id = $1
        returning *`,
      [req.params.id, body.supplierId ?? body.supplier_id ?? null, body.warehouseId ?? body.warehouse_id ?? null, body.expectedDate ?? body.expected_date ?? null, body.notes ?? null]
    );
    if (!row) return res.status(404).json({ success: false, message: "Purchase order not found" });
    return ok(res, mapPo(row), "Purchase order updated");
  })
);

purchaseOrdersRouter.patch(
  "/:id/status",
  requireMinimumRole("staff"),
  asyncHandler(async (req, res) => {
    const status = String(req.body.status ?? "");
    if (!["sent", "confirmed", "cancelled"].includes(status)) {
      return res.status(422).json({ success: false, message: "Status must be sent, confirmed, or cancelled" });
    }
    const row = await queryOne("update purchase_orders set status = $2 where id = $1 returning *", [req.params.id, status]);
    if (!row) return res.status(404).json({ success: false, message: "Purchase order not found" });
    return ok(res, mapPo(row), "Purchase order status updated");
  })
);

purchaseOrdersRouter.post(
  "/:id/receive",
  requireMinimumRole("staff"),
  validateBody(receiveSchema),
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = req.body as z.infer<typeof receiveSchema>;
    const result = await transaction(async (client) => {
      const po = await client.query("select * from purchase_orders where id = $1 for update", [req.params.id]);
      if (po.rowCount !== 1) throw new Error("Purchase order not found");
      for (const item of body.items) {
        const itemId = item.itemId ?? item.id;
        const productId = item.productId ?? item.product_id;
        const quantityReceived = item.quantityReceived ?? item.quantity_received ?? 0;
        if (quantityReceived <= 0) continue;
        const line = await client.query(
          `select * from purchase_order_items
            where po_id = $1 and ($2::uuid is null or id = $2) and ($3::uuid is null or product_id = $3)
            limit 1 for update`,
          [req.params.id, itemId ?? null, productId ?? null]
        );
        if (line.rowCount !== 1) throw new Error("Purchase order line not found");
        const nextReceived = Number(line.rows[0].quantity_received) + quantityReceived;
        if (nextReceived > Number(line.rows[0].quantity_ordered)) throw new Error("Received quantity exceeds ordered quantity");
        await client.query("update purchase_order_items set quantity_received = $2 where id = $1", [line.rows[0].id, nextReceived]);
        await adjustInventory(client, {
          productId: line.rows[0].product_id,
          warehouseId: po.rows[0].warehouse_id,
          quantityDelta: quantityReceived,
          movementType: "purchase",
          movementQuantity: quantityReceived,
          referenceId: po.rows[0].id,
          referenceType: "purchase_order",
          unitCost: Number(line.rows[0].unit_cost),
          notes: `Received ${po.rows[0].po_number}`,
          userId: req.user?.id ?? null,
          io: req.app.get("io")
        });
      }
      const completeness = await client.query(
        `select bool_and(quantity_received = quantity_ordered) as complete
           from purchase_order_items
          where po_id = $1`,
        [req.params.id]
      );
      const status = completeness.rows[0]?.complete ? "received" : "confirmed";
      const updated = await client.query(
        "update purchase_orders set status = $2, received_date = case when $2 = 'received' then current_date else received_date end where id = $1 returning *",
        [req.params.id, status]
      );
      return updated.rows[0];
    });
    return ok(res, mapPo(result), "Purchase order received");
  })
);
