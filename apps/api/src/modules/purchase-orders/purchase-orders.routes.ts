import { Router } from "express";
import { z } from "zod";

import { prisma } from "../../db/prisma.js";
import { requireMinimumRole, requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { adjustInventory } from "../../services/inventory.service.js";
import type { AuthRequest } from "../../types/index.js";
import { asyncHandler, created, ok, paginated } from "../../utils/http.js";
import { parseListQuery } from "../../utils/pagination.js";

export const purchaseOrdersRouter = Router();

const poItemSchema = z.object({
  productId: z.string().optional(),
  product_id: z.string().optional(),
  quantityOrdered: z.coerce.number().int().positive().optional(),
  quantity_ordered: z.coerce.number().int().positive().optional(),
  quantity: z.coerce.number().int().positive().optional(),
  unitCost: z.coerce.number().nonnegative().optional(),
  unit_cost: z.coerce.number().nonnegative().optional()
});

const poCreateSchema = z.object({
  supplierId: z.string().optional(),
  supplier_id: z.string().optional(),
  warehouseId: z.string().optional(),
  warehouse_id: z.string().optional(),
  expectedDate: z.string().optional().nullable(),
  expected_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(poItemSchema).min(1)
});

const receiveSchema = z.object({
  items: z.array(z.object({
    itemId: z.string().optional(),
    id: z.string().optional(),
    productId: z.string().optional(),
    product_id: z.string().optional(),
    quantityReceived: z.coerce.number().int().nonnegative().optional(),
    quantity_received: z.coerce.number().int().nonnegative().optional()
  }))
});

function orderNumber(prefix: string) {
  return `${prefix}-${new Date().getFullYear()}-${Math.floor(Date.now() % 900000)}`;
}

function mapPo(po: any) {
  return {
    id: po.id,
    poNumber: po.poNumber,
    number: po.poNumber,
    supplierId: po.supplierId,
    supplier: po.supplier?.name ?? null,
    warehouseId: po.warehouseId,
    warehouse: po.warehouse?.name ?? null,
    status: po.status,
    orderDate: po.orderDate,
    expectedDate: po.expectedDate,
    receivedDate: po.receivedDate,
    totalAmount: po.totalAmount,
    amount: po.totalAmount,
    notes: po.notes,
    createdBy: po.createdBy,
    createdAt: po.createdAt,
    updatedAt: po.updatedAt
  };
}

purchaseOrdersRouter.get(
  "/",
  requirePermission("orders:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "order_date");
    const where: any = {};
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.supplierId) where.supplierId = String(req.query.supplierId);

    const [total, orders] = await Promise.all([
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { name: true } },
          warehouse: { select: { name: true } }
        },
        orderBy: { orderDate: "desc" },
        take: list.limit,
        skip: list.offset
      })
    ]);

    return paginated(res, orders.map(mapPo), { page: list.page, limit: list.limit, total });
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
    if (!supplierId || !warehouseId) return res.status(400).json({ success: false, message: "supplierId and warehouseId required" });

    let total = 0;
    const normalizedItems = body.items.map((item) => {
      const productId = item.productId ?? item.product_id;
      const quantity = item.quantityOrdered ?? item.quantity_ordered ?? item.quantity;
      const unitCost = item.unitCost ?? item.unit_cost;
      if (!productId || !quantity || unitCost == null) throw new Error("Each item needs productId, quantity, and unitCost");
      total += quantity * unitCost;
      return { productId, quantityOrdered: quantity, unitCost };
    });

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber: orderNumber("PO"),
        supplierId,
        warehouseId,
        status: "draft",
        expectedDate: body.expectedDate ?? body.expected_date ? new Date(body.expectedDate ?? body.expected_date!) : null,
        totalAmount: total,
        notes: body.notes ?? null,
        createdBy: req.user?.id ?? null,
        items: { create: normalizedItems.map((i) => ({ productId: i.productId, quantityOrdered: i.quantityOrdered, unitCost: i.unitCost })) }
      },
      include: { supplier: { select: { name: true } }, warehouse: { select: { name: true } } }
    });

    return created(res, mapPo(po), "Purchase order created");
  })
);

purchaseOrdersRouter.get(
  "/:id",
  requirePermission("orders:read"),
  asyncHandler(async (req, res) => {
    const po = await prisma.purchaseOrder.findFirst({
      where: { OR: [{ id: String(req.params.id) }, { poNumber: String(req.params.id) }] },
      include: {
        supplier: { select: { name: true } },
        warehouse: { select: { name: true } },
        items: { include: { product: { select: { sku: true, name: true } } } }
      }
    });
    if (!po) return res.status(404).json({ success: false, message: "Purchase order not found" });

    return ok(res, {
      ...mapPo(po),
      items: po.items.map((i: any) => ({
        id: i.id, productId: i.productId, sku: i.product.sku, productName: i.product.name,
        quantityOrdered: i.quantityOrdered, quantityReceived: i.quantityReceived, unitCost: i.unitCost
      }))
    });
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
    const po = await prisma.purchaseOrder.update({
      where: { id: String(req.params.id) },
      data: { status },
      include: { supplier: { select: { name: true } }, warehouse: { select: { name: true } } }
    });
    return ok(res, mapPo(po), "Status updated");
  })
);

purchaseOrdersRouter.post(
  "/:id/receive",
  requireMinimumRole("staff"),
  validateBody(receiveSchema),
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = req.body as z.infer<typeof receiveSchema>;

    const result = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({ where: { id: String(req.params.id) }, include: { items: true } });
      if (!po) throw new Error("Purchase order not found");

      for (const item of body.items) {
        const itemId = item.itemId ?? item.id;
        const productId = item.productId ?? item.product_id;
        const quantityReceived = item.quantityReceived ?? item.quantity_received ?? 0;
        if (quantityReceived <= 0) continue;

        const line = po.items.find((i) =>
          (itemId && i.id === itemId) || (productId && i.productId === productId)
        ) ?? po.items[0];
        if (!line) throw new Error("PO line not found");

        const nextReceived = line.quantityReceived + quantityReceived;
        if (nextReceived > line.quantityOrdered) throw new Error("Received exceeds ordered");

        await tx.purchaseOrderItem.update({
          where: { id: line.id },
          data: { quantityReceived: nextReceived }
        });

        await adjustInventory(tx as any, {
          productId: line.productId,
          warehouseId: po.warehouseId,
          quantityDelta: quantityReceived,
          movementType: "purchase",
          movementQuantity: quantityReceived,
          referenceId: po.id,
          referenceType: "purchase_order",
          unitCost: line.unitCost,
          notes: `Received ${po.poNumber}`,
          userId: req.user?.id ?? null,
          io: req.app.get("io")
        });
      }

      // Check if fully received
      const updatedItems = await tx.purchaseOrderItem.findMany({ where: { poId: po.id } });
      const complete = updatedItems.every((i) => i.quantityReceived >= i.quantityOrdered);

      return tx.purchaseOrder.update({
        where: { id: po.id },
        data: {
          status: complete ? "received" : "confirmed",
          receivedDate: complete ? new Date() : po.receivedDate
        },
        include: { supplier: { select: { name: true } }, warehouse: { select: { name: true } } }
      });
    });

    return ok(res, mapPo(result), "Purchase order received");
  })
);
