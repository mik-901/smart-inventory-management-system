import { Router } from "express";
import { z } from "zod";

import { prisma } from "../../db/prisma.js";
import { requireMinimumRole, requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { adjustInventory } from "../../services/inventory.service.js";
import type { AuthRequest } from "../../types/index.js";
import { asyncHandler, created, ok, paginated } from "../../utils/http.js";
import { parseListQuery } from "../../utils/pagination.js";

export const salesOrdersRouter = Router();

const soItemSchema = z.object({
  productId: z.string().optional(),
  product_id: z.string().optional(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative().optional(),
  unit_price: z.coerce.number().nonnegative().optional(),
  discountPercent: z.coerce.number().nonnegative().default(0)
});

const soCreateSchema = z.object({
  customerName: z.string().min(2).optional(),
  customer_name: z.string().min(2).optional(),
  customerEmail: z.string().email().optional().nullable(),
  customer_email: z.string().email().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  customer_phone: z.string().optional().nullable(),
  warehouseId: z.string().optional(),
  warehouse_id: z.string().optional(),
  notes: z.string().optional().nullable(),
  items: z.array(soItemSchema).min(1)
});

function orderNumber() {
  return `SO-${new Date().getFullYear()}-${Math.floor(Date.now() % 900000)}`;
}

function mapSo(so: any) {
  return {
    id: so.id,
    soNumber: so.soNumber,
    number: so.soNumber,
    customerName: so.customerName,
    customerEmail: so.customerEmail,
    customerPhone: so.customerPhone,
    warehouseId: so.warehouseId,
    warehouse: so.warehouse?.name ?? null,
    status: so.status,
    orderDate: so.orderDate,
    shippedDate: so.shippedDate,
    deliveredDate: so.deliveredDate,
    trackingNumber: so.trackingNumber,
    carrierName: so.carrierName,
    totalAmount: so.totalAmount,
    amount: so.totalAmount,
    notes: so.notes,
    createdBy: so.createdBy,
    createdAt: so.createdAt,
    updatedAt: so.updatedAt
  };
}

salesOrdersRouter.get(
  "/",
  requirePermission("orders:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "order_date");
    const where: any = {};
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.warehouseId) where.warehouseId = String(req.query.warehouseId);

    const [total, orders] = await Promise.all([
      prisma.salesOrder.count({ where }),
      prisma.salesOrder.findMany({
        where,
        include: { warehouse: { select: { name: true } } },
        orderBy: { orderDate: "desc" },
        take: list.limit,
        skip: list.offset
      })
    ]);

    return paginated(res, orders.map(mapSo), { page: list.page, limit: list.limit, total });
  })
);

salesOrdersRouter.post(
  "/",
  requireMinimumRole("staff"),
  validateBody(soCreateSchema),
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = req.body as z.infer<typeof soCreateSchema>;
    const customerName = body.customerName ?? body.customer_name;
    const warehouseId = body.warehouseId ?? body.warehouse_id;
    if (!customerName || !warehouseId) return res.status(400).json({ success: false, message: "customerName and warehouseId required" });

    let total = 0;
    const normalizedItems = body.items.map((item) => {
      const productId = item.productId ?? item.product_id;
      const unitPrice = item.unitPrice ?? item.unit_price ?? 0;
      if (!productId) throw new Error("Each item needs productId");
      const lineTotal = item.quantity * unitPrice * (1 - (item.discountPercent ?? 0) / 100);
      total += lineTotal;
      return { productId, quantity: item.quantity, unitPrice, discountPercent: item.discountPercent ?? 0 };
    });

    const so = await prisma.$transaction(async (tx) => {
      // Verify stock availability
      for (const item of normalizedItems) {
        const inv = await tx.inventory.aggregate({
          where: { productId: item.productId, warehouseId },
          _sum: { quantity: true, reservedQuantity: true }
        });
        const available = (inv._sum.quantity ?? 0) - (inv._sum.reservedQuantity ?? 0);
        if (available < item.quantity) {
          const product = await tx.product.findUnique({ where: { id: item.productId }, select: { name: true } });
          throw new Error(`Insufficient stock for ${product?.name ?? item.productId}`);
        }
      }

      const order = await tx.salesOrder.create({
        data: {
          soNumber: orderNumber(),
          customerName,
          customerEmail: body.customerEmail ?? body.customer_email ?? null,
          customerPhone: body.customerPhone ?? body.customer_phone ?? null,
          warehouseId,
          status: "draft",
          totalAmount: total,
          notes: body.notes ?? null,
          createdBy: req.user?.id ?? null,
          items: { create: normalizedItems }
        },
        include: { warehouse: { select: { name: true } } }
      });

      return order;
    });

    return created(res, mapSo(so), "Sales order created");
  })
);

salesOrdersRouter.get(
  "/:id",
  requirePermission("orders:read"),
  asyncHandler(async (req, res) => {
    const so = await prisma.salesOrder.findFirst({
      where: { OR: [{ id: String(req.params.id) }, { soNumber: String(req.params.id) }] },
      include: {
        warehouse: { select: { name: true } },
        items: { include: { product: { select: { sku: true, name: true } } } }
      }
    });
    if (!so) return res.status(404).json({ success: false, message: "Sales order not found" });

    return ok(res, {
      ...mapSo(so),
      items: so.items.map((i: any) => ({
        id: i.id, productId: i.productId, sku: i.product.sku, productName: i.product.name,
        quantity: i.quantity, unitPrice: i.unitPrice, discountPercent: i.discountPercent
      }))
    });
  })
);

salesOrdersRouter.patch(
  "/:id/status",
  requireMinimumRole("staff"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const status = String(req.body.status ?? "");
    if (!["confirmed", "shipped", "delivered", "cancelled"].includes(status)) {
      return res.status(422).json({ success: false, message: "Invalid status" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.findUnique({ where: { id: String(req.params.id) }, include: { items: true } });
      if (!so) throw new Error("Sales order not found");

      // Deduct inventory on confirmation
      if (status === "confirmed" && so.status === "draft") {
        for (const item of so.items) {
          await adjustInventory(tx as any, {
            productId: item.productId,
            warehouseId: so.warehouseId,
            quantityDelta: -item.quantity,
            movementType: "sale",
            movementQuantity: item.quantity,
            referenceId: so.id,
            referenceType: "sales_order",
            unitCost: item.unitPrice,
            notes: `Sold ${so.soNumber}`,
            userId: req.user?.id ?? null,
            io: req.app.get("io")
          });
        }
      }

      return tx.salesOrder.update({
        where: { id: so.id },
        data: {
          status,
          shippedDate: status === "shipped" ? new Date() : so.shippedDate,
          deliveredDate: status === "delivered" ? new Date() : so.deliveredDate,
          trackingNumber: req.body.trackingNumber ?? req.body.tracking_number ?? so.trackingNumber,
          carrierName: req.body.carrierName ?? req.body.carrier_name ?? so.carrierName
        },
        include: { warehouse: { select: { name: true } } }
      });
    });

    return ok(res, mapSo(result), "Status updated");
  })
);
