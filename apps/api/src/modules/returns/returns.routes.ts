import { Router } from "express";
import { z } from "zod";

import { query, queryOne, transaction } from "../../db/pool.js";
import { requireMinimumRole, requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { adjustInventory } from "../../services/inventory.service.js";
import type { AuthRequest } from "../../types/index.js";
import { asyncHandler, created, ok, paginated } from "../../utils/http.js";
import { parseListQuery } from "../../utils/pagination.js";
import { dateOnly, toInteger } from "../../utils/serializers.js";

export const returnsRouter = Router();

const returnItemSchema = z.object({
  productId: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  quantity: z.coerce.number().int().positive(),
  condition: z.enum(["good", "damaged", "expired"]).default("good"),
  action: z.enum(["restock", "discard", "return_to_supplier"]).default("restock")
});

const returnCreateSchema = z.object({
  referenceType: z.enum(["sale", "purchase"]).optional(),
  reference_type: z.enum(["sale", "purchase"]).optional(),
  referenceId: z.string().uuid().optional().nullable(),
  reference_id: z.string().uuid().optional().nullable(),
  warehouseId: z.string().uuid().optional(),
  warehouse_id: z.string().uuid().optional(),
  reason: z.string().min(3),
  items: z.array(returnItemSchema).min(1)
});

function returnNumber() {
  return `RT-${new Date().getFullYear()}-${Math.floor(Date.now() % 900000)}`;
}

function mapReturn(row: Record<string, unknown>) {
  return {
    id: row.id,
    returnNumber: row.return_number,
    number: row.return_number,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    warehouseId: row.warehouse_id,
    warehouse: row.warehouse_name,
    reason: row.reason,
    status: row.status,
    totalItems: toInteger(row.total_items),
    items: toInteger(row.total_items),
    processedBy: row.processed_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    date: dateOnly(row.created_at)
  };
}

returnsRouter.get(
  "/",
  requirePermission("orders:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "created_at");
    const count = await queryOne<{ count: string }>("select count(*) from returns", []);
    const rows = await query(
      `select r.*, w.name as warehouse_name
         from returns r
         join warehouses w on w.id = r.warehouse_id
        order by r.created_at desc
        limit $1 offset $2`,
      [list.limit, list.offset]
    );
    return paginated(res, rows.map(mapReturn), { page: list.page, limit: list.limit, total: toInteger(count?.count) });
  })
);

returnsRouter.post(
  "/",
  requireMinimumRole("staff"),
  validateBody(returnCreateSchema),
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = req.body as z.infer<typeof returnCreateSchema>;
    const warehouseId = body.warehouseId ?? body.warehouse_id;
    const referenceType = body.referenceType ?? body.reference_type;
    if (!warehouseId || !referenceType) return res.status(400).json({ success: false, message: "referenceType and warehouseId are required" });

    const createdReturn = await transaction(async (client) => {
      const totalItems = body.items.reduce((sum, item) => sum + item.quantity, 0);
      const ret = await client.query(
        `insert into returns (return_number, reference_type, reference_id, warehouse_id, reason, status, total_items, processed_by)
         values ($1, $2, $3, $4, $5, 'pending', $6, $7)
         returning *`,
        [returnNumber(), referenceType, body.referenceId ?? body.reference_id ?? null, warehouseId, body.reason, totalItems, req.user?.id ?? null]
      );
      for (const item of body.items) {
        await client.query(
          `insert into return_items (return_id, product_id, quantity, condition, action)
           values ($1, $2, $3, $4, $5)`,
          [ret.rows[0].id, item.productId ?? item.product_id, item.quantity, item.condition, item.action]
        );
      }
      return ret.rows[0];
    });
    return created(res, mapReturn(createdReturn), "Return created");
  })
);

returnsRouter.get(
  "/:id",
  requirePermission("orders:read"),
  asyncHandler(async (req, res) => {
    const ret = await queryOne(
      `select r.*, w.name as warehouse_name
         from returns r
         join warehouses w on w.id = r.warehouse_id
        where r.id::text = $1 or r.return_number = $1`,
      [req.params.id]
    );
    if (!ret) return res.status(404).json({ success: false, message: "Return not found" });
    const items = await query(
      `select ri.*, p.sku, p.name as product_name
         from return_items ri
         join products p on p.id = ri.product_id
        where ri.return_id = $1`,
      [ret.id]
    );
    return ok(res, { ...mapReturn(ret), items });
  })
);

returnsRouter.patch(
  "/:id/approve",
  requireMinimumRole("manager"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const returnId = String(req.params.id);
    const updated = await transaction(async (client) => {
      const ret = await client.query("select * from returns where id = $1 for update", [returnId]);
      if (ret.rowCount !== 1) throw new Error("Return not found");
      if (ret.rows[0].status === "completed") return ret.rows[0];
      const items = await client.query("select * from return_items where return_id = $1", [returnId]);
      for (const item of items.rows) {
        if (item.action === "restock") {
          await adjustInventory(client, {
            productId: item.product_id,
            warehouseId: ret.rows[0].warehouse_id,
            quantityDelta: Number(item.quantity),
            movementType: "return",
            movementQuantity: Number(item.quantity),
            referenceId: returnId,
            referenceType: "return",
            notes: `Return ${ret.rows[0].return_number} restocked`,
            userId: req.user?.id ?? null,
            io: req.app.get("io")
          });
        } else if (item.action === "return_to_supplier") {
          await adjustInventory(client, {
            productId: item.product_id,
            warehouseId: ret.rows[0].warehouse_id,
            quantityDelta: -Number(item.quantity),
            movementType: "return",
            movementQuantity: Number(item.quantity),
            referenceId: returnId,
            referenceType: "return",
            notes: `Return ${ret.rows[0].return_number} sent to supplier`,
            userId: req.user?.id ?? null,
            io: req.app.get("io")
          });
        } else {
          await client.query(
            `insert into stock_movements (product_id, warehouse_id, movement_type, quantity, reference_id, reference_type, notes, created_by)
             values ($1, $2, 'damage', $3, $4, 'return', $5, $6)`,
            [item.product_id, ret.rows[0].warehouse_id, item.quantity, returnId, `Return ${ret.rows[0].return_number} discarded`, req.user?.id ?? null]
          );
        }
      }
      const row = await client.query(
        "update returns set status = 'completed', processed_by = $2 where id = $1 returning *",
        [returnId, req.user?.id ?? null]
      );
      return row.rows[0];
    });
    return ok(res, mapReturn(updated), "Return approved");
  })
);

returnsRouter.patch(
  "/:id/reject",
  requireMinimumRole("manager"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const row = await queryOne("update returns set status = 'rejected', processed_by = $2 where id = $1 returning *", [req.params.id, req.user?.id ?? null]);
    if (!row) return res.status(404).json({ success: false, message: "Return not found" });
    return ok(res, mapReturn(row), "Return rejected");
  })
);
