import { Router } from "express";
import { z } from "zod";

import { prisma } from "../../db/prisma.js";
import { requireMinimumRole, requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { adjustInventory } from "../../services/inventory.service.js";
import type { AuthRequest } from "../../types/index.js";
import { AppError, asyncHandler, ok, paginated } from "../../utils/http.js";
import { parseListQuery } from "../../utils/pagination.js";

export const inventoryRouter = Router();

const adjustSchema = z.object({
  sku: z.string().min(1).optional(),
  productId: z.string().optional(),
  product_id: z.string().optional(),
  warehouseId: z.string().optional(),
  warehouse_id: z.string().optional(),
  warehouse: z.string().optional(),
  quantity: z.coerce.number().int(),
  type: z.string(),
  toWarehouse: z.string().optional(),
  toWarehouseId: z.string().optional(),
  reason: z.string().optional().default("")
});

function mapInventory(i: any) {
  return {
    id: i.id,
    productId: i.productId,
    sku: i.product?.sku ?? i.sku ?? "",
    product: i.product?.name ?? i.productName ?? "",
    warehouseId: i.warehouseId,
    warehouse: i.warehouse?.name ?? i.warehouseName ?? "",
    quantity: i.quantity,
    reserved: i.reservedQuantity,
    available: i.quantity - i.reservedQuantity,
    batchNumber: i.batchNumber,
    expiryDate: i.expiryDate,
    lastCountedAt: i.lastCountedAt,
    updatedAt: i.updatedAt
  };
}

// ── GET /inventory ───────────────────────────────────────────────────────────

inventoryRouter.get(
  "/",
  requirePermission("inventory:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "updated_at");
    const where: any = {};

    if (req.query.warehouseId) where.warehouseId = String(req.query.warehouseId);
    if (req.query.productId) where.productId = String(req.query.productId);
    if (list.search) {
      where.product = {
        OR: [
          { name: { contains: list.search } },
          { sku: { contains: list.search } }
        ]
      };
    }

    const [total, rows] = await Promise.all([
      prisma.inventory.count({ where }),
      prisma.inventory.findMany({
        where,
        include: {
          product: { select: { sku: true, name: true, costPrice: true, sellingPrice: true, reorderPoint: true } },
          warehouse: { select: { name: true } }
        },
        orderBy: { updatedAt: "desc" },
        take: list.limit,
        skip: list.offset
      })
    ]);

    return paginated(res, rows.map(mapInventory), { page: list.page, limit: list.limit, total });
  })
);

// ── GET /inventory/summary ───────────────────────────────────────────────────

inventoryRouter.get(
  "/summary",
  requirePermission("inventory:read"),
  asyncHandler(async (_req, res) => {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT p.id as product_id, p.sku, p.name as product, p.reorder_point,
              COALESCE(SUM(i.quantity), 0) as total_quantity,
              COALESCE(SUM(i.reserved_quantity), 0) as total_reserved,
              COALESCE(SUM(i.quantity - i.reserved_quantity), 0) as total_available,
              COUNT(DISTINCT i.warehouse_id) as warehouse_count
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE p.is_active = 1
       GROUP BY p.id
       ORDER BY total_available ASC`
    );
    return ok(res, rows.map((r: any) => ({
      productId: r.product_id,
      sku: r.sku,
      product: r.product,
      reorderPoint: Number(r.reorder_point),
      totalQuantity: Number(r.total_quantity),
      totalReserved: Number(r.total_reserved),
      totalAvailable: Number(r.total_available),
      warehouseCount: Number(r.warehouse_count),
      isLowStock: Number(r.total_available) <= Number(r.reorder_point)
    })));
  })
);

// ── POST /inventory/adjust ───────────────────────────────────────────────────

inventoryRouter.post(
  "/adjust",
  requireMinimumRole("staff"),
  validateBody(adjustSchema),
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = req.body;

    // Resolve product
    let productId = body.productId ?? body.product_id;
    if (!productId && body.sku) {
      const p = await prisma.product.findUnique({ where: { sku: body.sku } });
      if (!p) throw new AppError(404, `Product SKU "${body.sku}" not found`);
      productId = p.id;
    }
    if (!productId) throw new AppError(400, "productId or sku required");

    // Resolve warehouse
    let warehouseId = body.warehouseId ?? body.warehouse_id;
    if (!warehouseId && body.warehouse) {
      const w = await prisma.warehouse.findFirst({ where: { name: body.warehouse } });
      if (!w) throw new AppError(400, `Warehouse "${body.warehouse}" not found`);
      warehouseId = w.id;
    }
    if (!warehouseId) throw new AppError(400, "warehouseId or warehouse required");

    const type = String(body.type).toUpperCase();
    const qty = Math.abs(body.quantity);

    if (type === "TRANSFER") {
      let toWarehouseId = body.toWarehouseId;
      if (!toWarehouseId && body.toWarehouse) {
        const tw = await prisma.warehouse.findFirst({ where: { name: body.toWarehouse } });
        if (!tw) throw new AppError(400, `Destination warehouse "${body.toWarehouse}" not found`);
        toWarehouseId = tw.id;
      }
      if (!toWarehouseId) throw new AppError(400, "toWarehouseId required for transfers");

      const result = await prisma.$transaction(async (tx) => {
        await adjustInventory(tx as any, {
          productId, warehouseId, quantityDelta: -qty,
          movementType: "transfer_out", movementQuantity: qty,
          referenceType: "manual_transfer", notes: body.reason || "Manual transfer",
          userId: req.user?.id ?? null, io: req.app.get("io")
        });
        return adjustInventory(tx as any, {
          productId, warehouseId: toWarehouseId, quantityDelta: qty,
          movementType: "transfer_in", movementQuantity: qty,
          referenceType: "manual_transfer", notes: body.reason || "Manual transfer",
          userId: req.user?.id ?? null, io: req.app.get("io")
        });
      });
      return ok(res, result, "Transfer completed");
    }

    const isSubtract = type === "REMOVE" || type === "DAMAGED" || type === "SALE";
    const result = await prisma.$transaction(async (tx) => {
      return adjustInventory(tx as any, {
        productId, warehouseId,
        quantityDelta: isSubtract ? -qty : qty,
        movementType: type === "DAMAGED" ? "damage" : type === "SALE" ? "sale" : type === "REMOVE" ? "adjustment" : "purchase",
        movementQuantity: qty,
        referenceType: "manual_adjustment",
        notes: body.reason || `Stock ${type}`,
        userId: req.user?.id ?? null,
        io: req.app.get("io")
      });
    });

    return ok(res, result, "Stock adjusted");
  })
);

// ── POST /inventory/import ───────────────────────────────────────────────────

inventoryRouter.post(
  "/import",
  requireMinimumRole("manager"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const items = req.body.items ?? req.body;
    if (!Array.isArray(items) || items.length === 0) throw new AppError(400, "No items provided");

    const results = { adjusted: 0, errors: [] as string[] };

    for (const item of items) {
      try {
        const sku = item.sku ?? item.SKU;
        if (!sku) { results.errors.push("Missing SKU"); continue; }

        const product = await prisma.product.findUnique({ where: { sku } });
        if (!product) { results.errors.push(`SKU ${sku} not found`); continue; }

        let warehouseId: string | undefined;
        if (item.warehouseId ?? item.warehouse_id) {
          warehouseId = item.warehouseId ?? item.warehouse_id;
        } else if (item.warehouse) {
          const w = await prisma.warehouse.findFirst({ where: { name: item.warehouse } });
          warehouseId = w?.id;
        }
        if (!warehouseId) {
          const first = await prisma.warehouse.findFirst({ where: { isActive: true } });
          warehouseId = first?.id;
        }
        if (!warehouseId) { results.errors.push(`${sku}: No warehouse`); continue; }

        const qty = Math.abs(Number(item.quantity ?? 0));
        if (qty <= 0) continue;

        await prisma.$transaction(async (tx) => {
          await adjustInventory(tx as any, {
            productId: product.id, warehouseId: warehouseId!,
            quantityDelta: qty, movementType: "purchase", movementQuantity: qty,
            referenceType: "csv_import", notes: "CSV import",
            userId: req.user?.id ?? null
          });
        });
        results.adjusted++;
      } catch (e: any) {
        results.errors.push(`${item.sku ?? "?"}: ${e.message}`);
      }
    }

    return ok(res, results, `Import complete: ${results.adjusted} adjusted`);
  })
);

// ── GET /inventory/movements ─────────────────────────────────────────────────

inventoryRouter.get(
  "/movements",
  requirePermission("inventory:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "created_at");
    const where: any = {};

    if (req.query.productId) where.productId = String(req.query.productId);
    if (req.query.warehouseId) where.warehouseId = String(req.query.warehouseId);
    if (req.query.type) where.movementType = String(req.query.type);

    const [total, movements] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { sku: true, name: true } },
          warehouse: { select: { name: true } },
          creator: { select: { name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: list.limit,
        skip: list.offset
      })
    ]);

    return paginated(
      res,
      movements.map((m) => ({
        id: m.id,
        productId: m.productId,
        sku: m.product.sku,
        product: m.product.name,
        warehouseId: m.warehouseId,
        warehouse: m.warehouse.name,
        movementType: m.movementType,
        quantity: m.quantity,
        referenceId: m.referenceId,
        referenceType: m.referenceType,
        unitCost: m.unitCost,
        totalCost: m.totalCost,
        notes: m.notes,
        createdBy: m.creator?.name ?? null,
        createdAt: m.createdAt
      })),
      { page: list.page, limit: list.limit, total }
    );
  })
);

// ── GET /inventory/lookup/:barcode ───────────────────────────────────────────

inventoryRouter.get(
  "/lookup/:barcode",
  requirePermission("inventory:read"),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({
      where: { OR: [{ barcode: String(req.params.barcode) }, { sku: String(req.params.barcode) }] },
      include: {
        category: { select: { name: true } },
        inventory: { include: { warehouse: { select: { id: true, name: true } } } }
      }
    });

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    return ok(res, {
      id: product.id,
      sku: product.sku,
      name: product.name,
      barcode: product.barcode,
      category: product.category?.name ?? null,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      imageUrl: product.imageUrl,
      inventory: product.inventory.map((i: any) => ({
        warehouseId: i.warehouseId,
        warehouse: i.warehouse.name,
        quantity: i.quantity,
        reserved: i.reservedQuantity,
        available: i.quantity - i.reservedQuantity
      }))
    });
  })
);
