import { Router } from "express";
import { z } from "zod";

import { prisma } from "../../db/prisma.js";
import { requireMinimumRole, requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { adjustInventory } from "../../services/inventory.service.js";
import type { AuthRequest } from "../../types/index.js";
import { asyncHandler, created, ok, paginated } from "../../utils/http.js";
import { parseListQuery } from "../../utils/pagination.js";

export const transfersRouter = Router();

const transferCreateSchema = z.object({
  fromWarehouseId: z.string().optional(),
  from_warehouse_id: z.string().optional(),
  toWarehouseId: z.string().optional(),
  to_warehouse_id: z.string().optional(),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.string().optional(),
    product_id: z.string().optional(),
    quantityRequested: z.coerce.number().int().positive().optional(),
    quantity_requested: z.coerce.number().int().positive().optional(),
    quantity: z.coerce.number().int().positive().optional()
  })).min(1)
});

function transferNumber() {
  return `TR-${new Date().getFullYear()}-${Math.floor(Date.now() % 900000)}`;
}

function mapTransfer(t: any) {
  return {
    id: t.id,
    transferNumber: t.transferNumber,
    number: t.transferNumber,
    fromWarehouseId: t.fromWarehouseId,
    fromWarehouse: t.fromWarehouse?.name ?? null,
    toWarehouseId: t.toWarehouseId,
    toWarehouse: t.toWarehouse?.name ?? null,
    status: t.status,
    transferDate: t.transferDate,
    completedDate: t.completedDate,
    notes: t.notes,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt
  };
}

transfersRouter.get(
  "/",
  requirePermission("orders:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "transfer_date");
    const where: any = {};
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.warehouseId) {
      where.OR = [
        { fromWarehouseId: String(req.query.warehouseId) },
        { toWarehouseId: String(req.query.warehouseId) }
      ];
    }

    const [total, transfers] = await Promise.all([
      prisma.transfer.count({ where }),
      prisma.transfer.findMany({
        where,
        include: {
          fromWarehouse: { select: { name: true } },
          toWarehouse: { select: { name: true } }
        },
        orderBy: { transferDate: "desc" },
        take: list.limit,
        skip: list.offset
      })
    ]);

    return paginated(res, transfers.map(mapTransfer), { page: list.page, limit: list.limit, total });
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
    if (!fromWarehouseId || !toWarehouseId) return res.status(400).json({ success: false, message: "fromWarehouseId and toWarehouseId required" });

    const transfer = await prisma.$transaction(async (tx) => {
      // Verify stock
      for (const item of body.items) {
        const productId = item.productId ?? item.product_id;
        const quantity = item.quantityRequested ?? item.quantity_requested ?? item.quantity;
        if (!productId || !quantity) throw new Error("Each item needs productId and quantity");

        const inv = await tx.inventory.aggregate({
          where: { productId, warehouseId: fromWarehouseId },
          _sum: { quantity: true, reservedQuantity: true }
        });
        const available = (inv._sum.quantity ?? 0) - (inv._sum.reservedQuantity ?? 0);
        if (available < quantity) throw new Error("Insufficient stock for transfer");
      }

      return tx.transfer.create({
        data: {
          transferNumber: transferNumber(),
          fromWarehouseId,
          toWarehouseId,
          status: "draft",
          initiatedBy: req.user?.id ?? null,
          notes: body.notes ?? null,
          items: {
            create: body.items.map((item) => ({
              productId: (item.productId ?? item.product_id)!,
              quantityRequested: item.quantityRequested ?? item.quantity_requested ?? item.quantity ?? 0
            }))
          }
        },
        include: {
          fromWarehouse: { select: { name: true } },
          toWarehouse: { select: { name: true } }
        }
      });
    });

    return created(res, mapTransfer(transfer), "Transfer created");
  })
);

transfersRouter.get(
  "/:id",
  requirePermission("orders:read"),
  asyncHandler(async (req, res) => {
    const transfer = await prisma.transfer.findFirst({
      where: { OR: [{ id: String(req.params.id) }, { transferNumber: String(req.params.id) }] },
      include: {
        fromWarehouse: { select: { name: true } },
        toWarehouse: { select: { name: true } },
        items: { include: { product: { select: { sku: true, name: true } } } }
      }
    });
    if (!transfer) return res.status(404).json({ success: false, message: "Transfer not found" });

    return ok(res, {
      ...mapTransfer(transfer),
      items: transfer.items.map((i: any) => ({
        id: i.id, productId: i.productId, sku: i.product.sku, productName: i.product.name,
        quantityRequested: i.quantityRequested, quantityTransferred: i.quantityTransferred
      }))
    });
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

    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.findUnique({
        where: { id: String(req.params.id) },
        include: { items: true }
      });
      if (!transfer) throw new Error("Transfer not found");

      if (normalized === "completed" && transfer.status !== "completed") {
        for (const item of transfer.items as any[]) {
          await adjustInventory(tx as any, {
            productId: item.productId,
            warehouseId: transfer.fromWarehouseId,
            quantityDelta: -item.quantityRequested,
            movementType: "transfer_out",
            movementQuantity: item.quantityRequested,
            referenceId: transfer.id,
            referenceType: "transfer",
            notes: `Transfer ${transfer.transferNumber} dispatched`,
            userId: req.user?.id ?? null,
            io: req.app.get("io")
          });
          await adjustInventory(tx as any, {
            productId: item.productId,
            warehouseId: transfer.toWarehouseId,
            quantityDelta: item.quantityRequested,
            movementType: "transfer_in",
            movementQuantity: item.quantityRequested,
            referenceId: transfer.id,
            referenceType: "transfer",
            notes: `Transfer ${transfer.transferNumber} received`,
            userId: req.user?.id ?? null,
            io: req.app.get("io")
          });
          await tx.transferItem.update({
            where: { id: item.id },
            data: { quantityTransferred: item.quantityRequested }
          });
        }
      }

      return tx.transfer.update({
        where: { id: transfer.id },
        data: {
          status: normalized,
          completedDate: normalized === "completed" ? new Date() : transfer.completedDate
        },
        include: {
          fromWarehouse: { select: { name: true } },
          toWarehouse: { select: { name: true } }
        }
      });
    });

    req.app.get("io")?.emit("transfer:updated", { id: String(req.params.id), status: normalized });
    return ok(res, mapTransfer(result), "Transfer status updated");
  })
);
