import { Router } from "express";
import { z } from "zod";

import { prisma } from "../../db/prisma.js";
import { requireMinimumRole, requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { adjustInventory } from "../../services/inventory.service.js";
import type { AuthRequest } from "../../types/index.js";
import { AppError, asyncHandler, created, noContent, ok, paginated } from "../../utils/http.js";
import { parseListQuery, sqlSort } from "../../utils/pagination.js";

export const productsRouter = Router();

// ── Zod schemas ──────────────────────────────────────────────────────────────

const productCreateSchema = z.object({
  sku: z.string().min(3),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  category_id: z.string().optional(),
  supplierId: z.string().optional(),
  supplier_id: z.string().optional(),
  supplier: z.string().optional(),
  unitOfMeasure: z.string().optional().default("unit"),
  costPrice: z.coerce.number().nonnegative().default(0),
  cost_price: z.coerce.number().nonnegative().optional(),
  sellingPrice: z.coerce.number().nonnegative().default(0),
  selling_price: z.coerce.number().nonnegative().optional(),
  price: z.coerce.number().nonnegative().optional(),
  reorderPoint: z.coerce.number().int().nonnegative().default(0),
  reorder_point: z.coerce.number().int().nonnegative().optional(),
  reorderLevel: z.coerce.number().int().nonnegative().optional(),
  reorderQuantity: z.coerce.number().int().nonnegative().default(0),
  barcode: z.string().optional().nullable(),
  batchTracking: z.boolean().optional().default(false),
  expiryTracking: z.boolean().optional().default(false),
  imageUrl: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  variants: z.array(z.string()).optional().default([])
});

const stockAdjustSchema = z.object({
  warehouseId: z.string().optional(),
  warehouse_id: z.string().optional(),
  warehouse: z.string().optional(),
  quantity: z.coerce.number().int(),
  type: z.string(),
  reason: z.string().optional().default("")
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapProduct(p: any) {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    description: p.description,
    category: p.category?.name ?? p.categoryName ?? null,
    categoryId: p.categoryId ?? p.category_id ?? null,
    supplier: p.supplier?.name ?? p.supplierName ?? null,
    supplierId: p.supplierId ?? p.supplier_id ?? null,
    unitOfMeasure: p.unitOfMeasure,
    costPrice: p.costPrice ?? p.cost_price ?? 0,
    sellingPrice: p.sellingPrice ?? p.selling_price ?? 0,
    price: p.sellingPrice ?? p.selling_price ?? 0,
    reorderPoint: p.reorderPoint ?? p.reorder_point ?? 0,
    reorderQuantity: p.reorderQuantity ?? p.reorder_quantity ?? 0,
    barcode: p.barcode,
    qrCode: p.qrCode ?? p.qr_code ?? null,
    batchTracking: p.batchTracking ?? false,
    expiryTracking: p.expiryTracking ?? false,
    imageUrl: p.imageUrl ?? p.image_url ?? null,
    isActive: p.isActive ?? p.is_active ?? true,
    variants: p.variants ?? [],
    stock: p._stock ?? 0,
    createdAt: p.createdAt ?? p.created_at,
    updatedAt: p.updatedAt ?? p.updated_at
  };
}

// ── GET /products ────────────────────────────────────────────────────────────

// ── GET /products/barcode/:code — Lookup by barcode (local catalog + external APIs) ──

productsRouter.get(
  "/barcode/:code",
  requirePermission("products:read"),
  asyncHandler(async (req, res) => {
    const code = String(req.params.code).trim();

    // 1. Check if product already exists in our inventory
    const existing = await prisma.product.findFirst({
      where: { barcode: code, isActive: true },
      include: { category: true, supplier: true, variants: true }
    });
    if (existing) {
      return ok(res, {
        found: true,
        source: "inventory",
        product: mapProduct(existing)
      });
    }

    // 2. Check local barcode catalog (pre-seeded real products)
    const catalogEntry = await prisma.barcodeProduct.findUnique({
      where: { barcode: code }
    });
    if (catalogEntry) {
      return ok(res, {
        found: true,
        source: "catalog",
        product: {
          name: catalogEntry.name,
          brand: catalogEntry.brand ?? "",
          category: catalogEntry.category ?? "Electronics",
          description: catalogEntry.description ?? "",
          barcode: catalogEntry.barcode,
          imageUrl: catalogEntry.imageUrl ?? null,
          costPrice: catalogEntry.costPrice ?? 0,
          sellingPrice: catalogEntry.sellingPrice ?? 0,
          unitOfMeasure: catalogEntry.unitOfMeasure
        }
      });
    }

    // 3. Try Open Food Facts (great for FMCG, food, beverages — unlimited & free)
    try {
      const offUrl = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`;
      const offRes = await fetch(offUrl, {
        signal: AbortSignal.timeout(4000),
        headers: { "User-Agent": "SmartInventory/1.0 (local-dev)" }
      });
      if (offRes.ok) {
        const offData = await offRes.json() as any;
        if (offData.status === 1 && offData.product) {
          const p = offData.product;
          return ok(res, {
            found: true,
            source: "openfoodfacts",
            product: {
              name: p.product_name ?? p.product_name_en ?? "Unknown Product",
              brand: p.brands ?? "",
              category: p.categories_tags?.[0]?.replace("en:", "").replace(/-/g, " ") ?? "Food & Beverages",
              description: p.generic_name ?? p.ingredients_text ?? "",
              barcode: code,
              imageUrl: p.image_url ?? p.image_front_url ?? null,
              costPrice: 0,
              sellingPrice: 0,
              unitOfMeasure: p.quantity ? "piece" : "piece"
            }
          });
        }
      }
    } catch {
      // timeout or network error — continue to next fallback
    }

    // 4. Try UPC Item DB (electronics, general goods — 100 lookups/day free)
    try {
      const upcUrl = `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(code)}`;
      const upcRes = await fetch(upcUrl, {
        signal: AbortSignal.timeout(4000),
        headers: { "User-Agent": "SmartInventory/1.0" }
      });
      if (upcRes.ok) {
        const upcData = await upcRes.json() as any;
        const item = upcData.items?.[0];
        if (item) {
          return ok(res, {
            found: true,
            source: "upcitemdb",
            product: {
              name: item.title ?? "Unknown Product",
              brand: item.brand ?? "",
              category: item.category ?? "Electronics",
              description: item.description ?? "",
              barcode: code,
              imageUrl: item.images?.[0] ?? null,
              costPrice: 0,
              sellingPrice: item.lowest_recorded_price
                ? Math.round(item.lowest_recorded_price * 83)
                : 0,
              unitOfMeasure: "piece"
            }
          });
        }
      }
    } catch {
      // ignore
    }

    // 5. Nothing found anywhere
    return ok(res, {
      found: false,
      source: null,
      product: null,
      message: "Barcode not found in any database. Please fill product details manually."
    });
  })
);



productsRouter.get(
  "/",
  requirePermission("products:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "created_at");
    const where: any = {};

    if (req.query.active !== undefined) where.isActive = req.query.active === "true";
    if (req.query.categoryId) where.categoryId = String(req.query.categoryId);
    if (req.query.supplierId) where.supplierId = String(req.query.supplierId);
    if (list.search) {
      where.OR = [
        { name: { contains: list.search } },
        { sku: { contains: list.search } },
        { barcode: { contains: list.search } }
      ];
    }

    const sortMap: Record<string, string> = {
      name: "name", sku: "sku", created_at: "createdAt", cost_price: "costPrice", selling_price: "sellingPrice"
    };
    const orderField = sortMap[list.sort] ?? "createdAt";

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
          variants: true,
          inventory: { select: { quantity: true, reservedQuantity: true } }
        },
        orderBy: { [orderField]: list.order },
        take: list.limit,
        skip: list.offset
      })
    ]);

    const mapped = products.map((p) => {
      const totalQty = p.inventory.reduce((s: number, i: any) => s + i.quantity, 0);
      const totalReserved = p.inventory.reduce((s: number, i: any) => s + i.reservedQuantity, 0);
      return {
        ...mapProduct(p),
        stock: totalQty,
        totalStock: totalQty,
        availableStock: totalQty - totalReserved
      };
    });

    return paginated(res, mapped, { page: list.page, limit: list.limit, total });
  })
);

// ── GET /products/:id ────────────────────────────────────────────────────────

productsRouter.get(
  "/:id",
  requirePermission("products:read"),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({
      where: { OR: [{ id: String(req.params.id) }, { sku: String(req.params.id) }] },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        variants: true,
        inventory: {
          include: { warehouse: { select: { id: true, name: true } } }
        }
      }
    });

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const totalQty = product.inventory.reduce((s: number, i: any) => s + i.quantity, 0);

    return ok(res, {
      ...mapProduct(product),
      stock: totalQty,
      inventoryByWarehouse: product.inventory.map((i: any) => ({
        warehouseId: i.warehouseId,
        warehouse: i.warehouse.name,
        quantity: i.quantity,
        reserved: i.reservedQuantity,
        available: i.quantity - i.reservedQuantity,
        batchNumber: i.batchNumber,
        expiryDate: i.expiryDate
      }))
    });
  })
);

// ── POST /products ───────────────────────────────────────────────────────────

productsRouter.post(
  "/",
  requireMinimumRole("staff"),
  validateBody(productCreateSchema),
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = req.body;

    // Resolve category by name if needed
    let categoryId = body.categoryId ?? body.category_id ?? null;
    if (!categoryId && body.category) {
      const cat = await prisma.category.upsert({
        where: { name: body.category },
        create: { name: body.category },
        update: { name: body.category }
      });
      categoryId = cat.id;
    }

    // Resolve supplier by name if needed
    let supplierId = body.supplierId ?? body.supplier_id ?? null;
    if (!supplierId && body.supplier) {
      const sup = await prisma.supplier.findFirst({ where: { name: body.supplier } });
      supplierId = sup?.id ?? null;
    }

    const product = await prisma.product.create({
      data: {
        sku: body.sku,
        name: body.name,
        description: body.description ?? null,
        categoryId,
        supplierId,
        unitOfMeasure: body.unitOfMeasure ?? "unit",
        costPrice: body.costPrice ?? body.cost_price ?? 0,
        sellingPrice: body.sellingPrice ?? body.selling_price ?? body.price ?? 0,
        reorderPoint: body.reorderPoint ?? body.reorder_point ?? body.reorderLevel ?? 0,
        reorderQuantity: body.reorderQuantity ?? 0,
        barcode: body.barcode ?? null,
        imageUrl: body.imageUrl ?? body.image_url ?? null,
        batchTracking: body.batchTracking ?? false,
        expiryTracking: body.expiryTracking ?? false
      },
      include: { category: true, supplier: true }
    });

    // Create variants
    if (body.variants?.length) {
      for (let i = 0; i < body.variants.length; i++) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            variantName: body.variants[i],
            skuSuffix: `V${i + 1}`
          }
        });
      }
    }

    return created(res, mapProduct(product));
  })
);

// ── PUT /products/:id ────────────────────────────────────────────────────────

productsRouter.put(
  "/:id",
  requireMinimumRole("staff"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = req.body;

    let categoryId = body.categoryId ?? body.category_id ?? undefined;
    if (!categoryId && body.category) {
      const cat = await prisma.category.upsert({
        where: { name: body.category },
        create: { name: body.category },
        update: { name: body.category }
      });
      categoryId = cat.id;
    }

    const product = await prisma.product.update({
      where: { id: String(req.params.id) },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.sku && { sku: body.sku }),
        ...(body.description !== undefined && { description: body.description }),
        ...(categoryId && { categoryId }),
        ...(body.supplierId ?? body.supplier_id ? { supplierId: body.supplierId ?? body.supplier_id } : {}),
        ...(body.costPrice ?? body.cost_price ? { costPrice: Number(body.costPrice ?? body.cost_price) } : {}),
        ...(body.sellingPrice ?? body.selling_price ?? body.price ? { sellingPrice: Number(body.sellingPrice ?? body.selling_price ?? body.price) } : {}),
        ...(body.reorderPoint ?? body.reorder_point ?? body.reorderLevel ? { reorderPoint: Number(body.reorderPoint ?? body.reorder_point ?? body.reorderLevel) } : {}),
        ...(body.barcode !== undefined && { barcode: body.barcode }),
        ...(body.imageUrl ?? body.image_url ? { imageUrl: body.imageUrl ?? body.image_url } : {}),
        ...(body.isActive !== undefined && { isActive: body.isActive })
      },
      include: { category: true, supplier: true, variants: true }
    });

    return ok(res, mapProduct(product), "Product updated");
  })
);

// ── DELETE /products/:id ─────────────────────────────────────────────────────

productsRouter.delete(
  "/:id",
  requireMinimumRole("manager"),
  asyncHandler(async (req, res) => {
    await prisma.product.update({ where: { id: String(req.params.id) }, data: { isActive: false } });
    return noContent(res);
  })
);

// ── POST /products/:id/adjust-stock ──────────────────────────────────────────

productsRouter.post(
  "/:id/adjust-stock",
  requireMinimumRole("staff"),
  validateBody(stockAdjustSchema),
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = req.body;
    const productId = String(req.params.id);

    // Resolve warehouse
    let warehouseId = body.warehouseId ?? body.warehouse_id;
    if (!warehouseId && body.warehouse) {
      const wh = await prisma.warehouse.findFirst({ where: { name: body.warehouse } });
      if (!wh) throw new AppError(400, `Warehouse "${body.warehouse}" not found`);
      warehouseId = wh.id;
    }
    if (!warehouseId) {
      const firstWh = await prisma.warehouse.findFirst({ where: { isActive: true } });
      warehouseId = firstWh?.id;
    }
    if (!warehouseId) throw new AppError(400, "No warehouse available");

    const type = String(body.type).toUpperCase();
    const qty = Math.abs(body.quantity);
    const isSubtract = type === "REMOVE" || type === "DAMAGED" || type === "SALE";

    const result = await prisma.$transaction(async (tx) => {
      return adjustInventory(tx as any, {
        productId,
        warehouseId,
        quantityDelta: isSubtract ? -qty : qty,
        movementType: type === "REMOVE" ? "adjustment" : type === "DAMAGED" ? "damage" : type === "SALE" ? "sale" : "purchase",
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

// ── POST /products/import ────────────────────────────────────────────────────

productsRouter.post(
  "/import",
  requireMinimumRole("manager"),
  asyncHandler<AuthRequest>(async (req, res) => {
    const items = req.body.products ?? req.body.items ?? req.body;
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError(400, "No products provided");
    }

    const results = { created: 0, updated: 0, errors: [] as string[] };

    for (const item of items) {
      try {
        const sku = item.sku ?? item.SKU;
        if (!sku) { results.errors.push("Missing SKU"); continue; }

        let categoryId: string | null = null;
        if (item.category) {
          const cat = await prisma.category.upsert({
            where: { name: item.category },
            create: { name: item.category },
            update: { name: item.category }
          });
          categoryId = cat.id;
        }

        const existing = await prisma.product.findUnique({ where: { sku } });
        if (existing) {
          await prisma.product.update({
            where: { sku },
            data: {
              name: item.name ?? existing.name,
              costPrice: item.costPrice ?? item.cost_price ?? existing.costPrice,
              sellingPrice: item.sellingPrice ?? item.selling_price ?? item.price ?? existing.sellingPrice,
              ...(categoryId && { categoryId })
            }
          });
          results.updated++;
        } else {
          await prisma.product.create({
            data: {
              sku,
              name: item.name ?? sku,
              costPrice: Number(item.costPrice ?? item.cost_price ?? 0),
              sellingPrice: Number(item.sellingPrice ?? item.selling_price ?? item.price ?? 0),
              reorderPoint: Number(item.reorderPoint ?? item.reorder_point ?? item.reorderLevel ?? 0),
              categoryId,
              barcode: item.barcode ?? null,
              imageUrl: item.imageUrl ?? item.image_url ?? null
            }
          });
          results.created++;
        }
      } catch (e: any) {
        results.errors.push(`${item.sku ?? "?"}: ${e.message}`);
      }
    }

    return ok(res, results, `Imported: ${results.created} created, ${results.updated} updated`);
  })
);
