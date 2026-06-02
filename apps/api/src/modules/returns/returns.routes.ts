import { Router } from "express";
import { z } from "zod";

import { prisma } from "../../db/prisma.js";
import { requireMinimumRole, requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { adjustInventory } from "../../services/inventory.service.js";
import type { AuthRequest } from "../../types/index.js";
import { asyncHandler, created, ok, paginated } from "../../utils/http.js";
import { parseListQuery } from "../../utils/pagination.js";

export const returnsRouter = Router();

const returnCreateSchema = z.object({
  referenceType: z.enum(["sale", "purchase"]).optional().default("sale"),
  reference_type: z.enum(["sale", "purchase"]).optional(),
  referenceId: z.string().optional().nullable(),
  reference_id: z.string().optional().nullable(),
  warehouseId: z.string().optional(),
  warehouse_id: z.string().optional(),
  warehouse: z.string().optional(),
  reason: z.string().min(3),
  items: z.array(z.object({
    productId: z.string().optional(),
    product_id: z.string().optional(),
    quantity: z.coerce.number().int().positive(),
    condition: z.enum(["good", "damaged", "expired"]).default("good"),
    action: z.enum(["restock", "discard", "return_to_supplier"]).default("restock")
  })).min(1)
});

function returnNumber() {
  return `RET-${new Date().getFullYear()}-${Math.floor(Date.now() % 900000)}`;
}

function mapReturn(r: any) {
  return {
    id: r.id,
    returnNumber: r.returnNumber,
    number: r.returnNumber,
    referenceType: r.referenceType,
    referenceId: r.referenceId,
    warehouseId: r.warehouseId,
    warehouse: r.warehouse?.name ?? null,
    reason: r.reason,
    status: r.status,
    totalItems: r.totalItems,
    processedBy: r.processedBy,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt
  };
}

returnsRouter.get(
  "/",
  requirePermission("orders:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "created_at");
    const where: any = {};
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.referenceType) where.referenceType = String(req.query.referenceType);

    const [total, returns] = await Promise.all([
      prisma.return.count({ where }),
      prisma.return.findMany({
        where,
        include: { warehouse: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: list.limit,
        skip: list.offset
      })
    ]);

    return paginated(res, returns.map(mapReturn), { page: list.page, limit: list.limit, total });
  })
);

returnsRouter.post(
  "/",
  requireMinimumRole("staff"),
  validateBody(returnCreateSchema),
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = req.body as z.infer<typeof returnCreateSchema>;
    const warehouseId = body.warehouseId ?? body.warehouse_id;
    if (!warehouseId && !body.warehouse) return res.status(400).json({ success: false, message: "warehouseId required" });

    let resolvedWarehouseId = warehouseId;
    if (!resolvedWarehouseId && body.warehouse) {
      const w = await prisma.warehouse.findFirst({ where: { name: body.warehouse } });
      if (!w) return res.status(400).json({ success: false, message: "Warehouse not found" });
      resolvedWarehouseId = w.id;
    }

    const totalItems = body.items.reduce((s, i) => s + i.quantity, 0);

    const ret = await prisma.return.create({
      data: {
        returnNumber: returnNumber(),
        referenceType: body.referenceType ?? body.reference_type ?? "sale",
        referenceId: body.referenceId ?? body.reference_id ?? null,
        warehouseId: resolvedWarehouseId!,
        reason: body.reason,
        status: "pending",
        totalItems,
        items: {
          create: body.items.map((i: any) => ({
            productId: (i.productId ?? i.product_id)!,
            quantity: i.quantity,
            condition: i.condition,
            action: i.action
          }))
        }
      },
      include: { warehouse: { select: { name: true } } }
    });

    return created(res, mapReturn(ret), "Return created");
  })
);

returnsRouter.get(
  "/:id",
  requirePermission("orders:read"),
  asyncHandler(async (req, res) => {
    const ret = await prisma.return.findFirst({
      where: { OR: [{ id: String(req.params.id) }, { returnNumber: String(req.params.id) }] },
      include: {
        warehouse: { select: { name: true } },
        items: { include: { product: { select: { sku: true, name: true } } } }
      }
    });
    if (!ret) return res.status(404).json({ success: false, message: "Return not found" });

    return ok(res, {
      ...mapReturn(ret),
      items: ret.items.map((i: any) => ({
        id: i.id, productId: i.productId, sku: i.product.sku, productName: i.product.name,
        quantity: i.quantity, condition: i.condition, action: i.action
      }))
    });
  })
);

returnsRouter.patch(
  "/:id/status",
  requireMinimumRole("manager"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const status = String(req.body.status ?? "");
    if (!["approved", "rejected", "completed"].includes(status)) {
      return res.status(422).json({ success: false, message: "Invalid return status" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const ret = await tx.return.findUnique({
        where: { id: String(req.params.id) },
        include: { items: true }
      });
      if (!ret) throw new Error("Return not found");

      // On completion, restock items with action="restock"
      if (status === "completed" && ret.status !== "completed") {
        for (const item of ret.items) {
          if (item.action === "restock") {
            await adjustInventory(tx as any, {
              productId: item.productId,
              warehouseId: ret.warehouseId,
              quantityDelta: item.quantity,
              movementType: "return",
              movementQuantity: item.quantity,
              referenceId: ret.id,
              referenceType: "return",
              notes: `Return ${ret.returnNumber}: ${item.condition}`,
              userId: req.user?.id ?? null,
              io: req.app.get("io")
            });
          }
        }
      }

      return tx.return.update({
        where: { id: ret.id },
        data: { status, processedBy: req.user?.id ?? null },
        include: { warehouse: { select: { name: true } } }
      });
    });

    return ok(res, mapReturn(result), "Return status updated");
  })
);
