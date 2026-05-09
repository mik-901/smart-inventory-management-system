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

export const transfersRouter = Router();

const transferCreateSchema = z.object({
  fromWarehouseId: z.string().uuid().optional(),
  from_warehouse_id: z.string().uuid().optional(),
  toWarehouseId: z.string().uuid().optional(),
  to_warehouse_id: z.string().uuid().optional(),
  notes: z.string().optional().nullable(),
  items: z.array(
    z.object({
      productId: z.string().uuid().optional(),
      product_id: z.string().uuid().optional(),
      quantityRequested: z.coerce.number().int().positive().optional(),
      quantity_requested: z.coerce.number().int().positive().optional(),
      quantity: z.coerce.number().int().positive().optional()
    })
  ).min(1)
});

function transferNumber() {
  return `TR-${new Date().getFullYear()}-${Math.floor(Date.now() % 900000)}`;
}

function mapTransfer(row: Record<string, unknown>) {
  return {
    id: row.id,
    transferNumber: row.transfer_number,
    number: row.transfer_number,
    fromWarehouseId: row.from_warehouse_id,
    fromWarehouse: row.from_warehouse_name,
    toWarehouseId: row.to_warehouse_id,
    toWarehouse: row.to_warehouse_name,
    status: row.status,
    transferDate: dateOnly(row.transfer_date),
    completedDate: dateOnly(row.completed_date),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

transfersRouter.get(
  "/",
  requirePermission("orders:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "transfer_date");
    const filters: string[] = [];
    const params: unknown[] = [];
    if (req.query.status) {
      params.push(req.query.status);
      filters.push(`t.status = $${params.length}`);
    }
    if (req.query.warehouseId) {
      params.push(req.query.warehouseId);
      filters.push(`(t.from_warehouse_id = $${params.length} or t.to_warehouse_id = $${params.length})`);
    }
    const where = filters.length ? `where ${filters.join(" and ")}` : "";
    const count = await queryOne<{ count: string }>(`select count(*) from transfers t ${where}`, params);
    const rows = await query(
      `select t.*, fw.name as from_warehouse_name, tw.name as to_warehouse_name
         from transfers t
         join warehouses fw on fw.id = t.from_warehouse_id
         join warehouses tw on tw.id = t.to_warehouse_id
         ${where}
        order by t.transfer_date desc, t.created_at desc
        limit $${params.length + 1} offset $${params.length + 2}`,
      [...params, list.limit, list.offset]
    );
    return paginated(res, rows.map(mapTransfer), { page: list.page, limit: list.limit, total: toInteger(count?.count) });
  })
);

transfersRouter.post(
  "/",
  requireMinimumRole("staff"),
  validateBody(transferCreateSchema),
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = req.body as z.infer<typeof transferCreateSchema>;
    const fromWarehouseId = body.fromWarehouseId ?? body.from_warehouse_id;
    const toWarehouseId = body.toWarehouseId ?? body.to_warehouse_id;
    if (!fromWarehouseId || !toWarehouseId) return res.status(400).json({ success: false, message: "fromWarehouseId and toWarehouseId are required" });

    const createdTransfer = await transaction(async (client) => {
      for (const item of body.items) {
        const productId = item.productId ?? item.product_id;
        const quantity = item.quantityRequested ?? item.quantity_requested ?? item.quantity;
        if (!productId || !quantity) throw new Error("Each item needs productId and quantity");
        const available = await client.query(
          "select coalesce(sum(available_quantity), 0)::int as available from inventory where product_id = $1 and warehouse_id = $2",
          [productId, fromWarehouseId]
        );
        if (Number(available.rows[0]?.available ?? 0) < quantity) throw new Error("Insufficient stock for transfer");
      }

      const transfer = await client.query(
        `insert into transfers (transfer_number, from_warehouse_id, to_warehouse_id, status, initiated_by, notes)
         values ($1, $2, $3, 'draft', $4, $5)
         returning *`,
        [transferNumber(), fromWarehouseId, toWarehouseId, req.user?.id ?? null, body.notes ?? null]
      );
      for (const item of body.items) {
        await client.query(
          `insert into transfer_items (transfer_id, product_id, quantity_requested)
           values ($1, $2, $3)`,
          [transfer.rows[0].id, item.productId ?? item.product_id, item.quantityRequested ?? item.quantity_requested ?? item.quantity]
        );
      }
      return transfer.rows[0];
    });
    return created(res, mapTransfer(createdTransfer), "Transfer created");
  })
);

transfersRouter.get(
  "/:id",
  requirePermission("orders:read"),
  asyncHandler(async (req, res) => {
    const transfer = await queryOne(
      `select t.*, fw.name as from_warehouse_name, tw.name as to_warehouse_name
         from transfers t
         join warehouses fw on fw.id = t.from_warehouse_id
         join warehouses tw on tw.id = t.to_warehouse_id
        where t.id::text = $1 or t.transfer_number = $1`,
      [req.params.id]
    );
    if (!transfer) return res.status(404).json({ success: false, message: "Transfer not found" });
    const items = await query(
      `select ti.*, p.sku, p.name as product_name
         from transfer_items ti
         join products p on p.id = ti.product_id
        where ti.transfer_id = $1`,
      [transfer.id]
    );
    return ok(res, { ...mapTransfer(transfer), items });
  })
);

transfersRouter.patch(
  "/:id/status",
  requireMinimumRole("staff"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const status = String(req.body.status ?? "");
    if (!["in_transit", "completed", "cancelled", "dispatch", "complete"].includes(status)) {
      return res.status(422).json({ success: false, message: "Invalid transfer status" });
    }
    const normalized = status === "dispatch" ? "in_transit" : status === "complete" ? "completed" : status;

    const transferId = String(req.params.id);
    const updatedTransfer = await transaction(async (client) => {
      const transfer = await client.query("select * from transfers where id = $1 for update", [transferId]);
      if (transfer.rowCount !== 1) throw new Error("Transfer not found");
      if (normalized === "completed" && transfer.rows[0].status !== "completed") {
        const items = await client.query("select * from transfer_items where transfer_id = $1", [transferId]);
        for (const item of items.rows) {
          await adjustInventory(client, {
            productId: item.product_id,
            warehouseId: transfer.rows[0].from_warehouse_id,
            quantityDelta: -Number(item.quantity_requested),
            movementType: "transfer_out",
            movementQuantity: Number(item.quantity_requested),
            referenceId: transferId,
            referenceType: "transfer",
            notes: `Transfer ${transfer.rows[0].transfer_number} dispatched`,
            userId: req.user?.id ?? null,
            io: req.app.get("io")
          });
          await adjustInventory(client, {
            productId: item.product_id,
            warehouseId: transfer.rows[0].to_warehouse_id,
            quantityDelta: Number(item.quantity_requested),
            movementType: "transfer_in",
            movementQuantity: Number(item.quantity_requested),
            referenceId: transferId,
            referenceType: "transfer",
            notes: `Transfer ${transfer.rows[0].transfer_number} received`,
            userId: req.user?.id ?? null,
            io: req.app.get("io")
          });
          await client.query("update transfer_items set quantity_transferred = quantity_requested where id = $1", [item.id]);
        }
      }
      const row = await client.query(
        `update transfers
            set status = $2,
                completed_date = case when $2 = 'completed' then current_date else completed_date end
          where id = $1
          returning *`,
        [transferId, normalized]
      );
      return row.rows[0];
    });
    req.app.get("io")?.emit("transfer:updated", { id: transferId, status: normalized });
    return ok(res, mapTransfer(updatedTransfer), "Transfer status updated");
  })
);
