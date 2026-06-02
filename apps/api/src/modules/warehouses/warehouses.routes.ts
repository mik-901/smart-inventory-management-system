import { Router } from "express";
import { z } from "zod";

import { prisma } from "../../db/prisma.js";
import { requireMinimumRole, requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import type { AuthRequest } from "../../types/index.js";
import { asyncHandler, created, noContent, ok, paginated } from "../../utils/http.js";
import { parseListQuery } from "../../utils/pagination.js";

export const warehousesRouter = Router();

const warehouseSchema = z.object({
  name: z.string().min(2),
  location: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().min(1),
  country: z.string().optional().default("India"),
  capacity: z.coerce.number().int().nonnegative().default(0),
  managerId: z.string().optional().nullable(),
  manager_id: z.string().optional().nullable()
});

function mapWarehouse(w: any) {
  return {
    id: w.id,
    name: w.name,
    location: w.location,
    code: w.name?.slice(0, 3).toUpperCase() ?? "",
    address: w.address,
    city: w.city,
    country: w.country,
    capacity: w.capacity,
    managerId: w.managerId,
    managerName: w.manager?.name ?? null,
    isActive: w.isActive,
    totalStock: w._totalStock ?? 0,
    productCount: w._productCount ?? 0,
    utilization: w.capacity > 0 ? Math.round(((w._totalStock ?? 0) / w.capacity) * 100) : 0,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt
  };
}

warehousesRouter.get(
  "/",
  requirePermission("warehouses:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "name");
    const where: any = {};
    if (req.query.active !== undefined) where.isActive = req.query.active === "true";
    if (list.search) where.name = { contains: list.search };

    const [total, warehouses] = await Promise.all([
      prisma.warehouse.count({ where }),
      prisma.warehouse.findMany({
        where,
        include: {
          manager: { select: { name: true } },
          inventory: { select: { quantity: true, productId: true } }
        },
        orderBy: { name: "asc" },
        take: list.limit,
        skip: list.offset
      })
    ]);

    const mapped = warehouses.map((w) => {
      const totalStock = w.inventory.reduce((s: number, i: any) => s + i.quantity, 0);
      const productIds = new Set(w.inventory.map((i: any) => i.productId));
      return mapWarehouse({ ...w, _totalStock: totalStock, _productCount: productIds.size });
    });

    return paginated(res, mapped, { page: list.page, limit: list.limit, total });
  })
);

warehousesRouter.get(
  "/:id",
  requirePermission("warehouses:read"),
  asyncHandler(async (req, res) => {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: String(req.params.id) },
      include: {
        manager: { select: { name: true } },
        inventory: {
          include: {
            product: { select: { sku: true, name: true, costPrice: true } }
          }
        }
      }
    });

    if (!warehouse) return res.status(404).json({ success: false, message: "Warehouse not found" });

    const totalStock = warehouse.inventory.reduce((s: number, i: any) => s + i.quantity, 0);
    const productIds = new Set(warehouse.inventory.map((i: any) => i.productId));

    return ok(res, {
      ...mapWarehouse({ ...warehouse, _totalStock: totalStock, _productCount: productIds.size }),
      inventory: warehouse.inventory.map((i: any) => ({
        productId: i.productId,
        sku: i.product.sku,
        product: i.product.name,
        quantity: i.quantity,
        reserved: i.reservedQuantity,
        available: i.quantity - i.reservedQuantity,
        value: i.quantity * i.product.costPrice
      }))
    });
  })
);

warehousesRouter.post(
  "/",
  requireMinimumRole("manager"),
  validateBody(warehouseSchema),
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = req.body;
    const warehouse = await prisma.warehouse.create({
      data: {
        name: body.name,
        location: body.location ?? null,
        address: body.address ?? null,
        city: body.city,
        country: body.country ?? "India",
        capacity: body.capacity ?? 0,
        managerId: body.managerId ?? body.manager_id ?? null
      },
      include: { manager: { select: { name: true } } }
    });
    return created(res, mapWarehouse({ ...warehouse, _totalStock: 0, _productCount: 0 }));
  })
);

warehousesRouter.put(
  "/:id",
  requireMinimumRole("manager"),
  asyncHandler(async (req, res) => {
    const body = req.body;
    const warehouse = await prisma.warehouse.update({
      where: { id: String(req.params.id) },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.city && { city: body.city }),
        ...(body.country && { country: body.country }),
        ...(body.capacity !== undefined && { capacity: Number(body.capacity) }),
        ...(body.managerId ?? body.manager_id ? { managerId: body.managerId ?? body.manager_id } : {}),
        ...(body.isActive !== undefined && { isActive: body.isActive })
      },
      include: { manager: { select: { name: true } } }
    });
    return ok(res, mapWarehouse({ ...warehouse, _totalStock: 0, _productCount: 0 }), "Warehouse updated");
  })
);

warehousesRouter.delete(
  "/:id",
  requireMinimumRole("manager"),
  asyncHandler(async (req, res) => {
    await prisma.warehouse.update({ where: { id: String(req.params.id) }, data: { isActive: false } });
    return noContent(res);
  })
);
