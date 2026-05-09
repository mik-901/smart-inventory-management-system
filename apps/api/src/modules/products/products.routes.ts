import { Router } from "express";
import multer from "multer";
import { z } from "zod";

import { query, queryOne, transaction } from "../../db/pool.js";
import { requireMinimumRole, requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { adjustInventory } from "../../services/inventory.service.js";
import type { AuthRequest } from "../../types/index.js";
import { asyncHandler, created, noContent, ok, paginated } from "../../utils/http.js";
import { parseListQuery, sqlSort } from "../../utils/pagination.js";
import { dateOnly, toInteger, toNumber } from "../../utils/serializers.js";

export const productsRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const variantSchema = z.object({
  variantName: z.string().optional(),
  variant_name: z.string().optional(),
  skuSuffix: z.string().optional(),
  sku_suffix: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()).default({}),
  costPrice: z.coerce.number().nonnegative().optional(),
  cost_price: z.coerce.number().nonnegative().optional(),
  sellingPrice: z.coerce.number().nonnegative().optional(),
  selling_price: z.coerce.number().nonnegative().optional(),
  barcode: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  is_active: z.boolean().optional()
});

const productSchema = z.object({
  sku: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  category: z.string().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  supplier_id: z.string().uuid().optional().nullable(),
  supplier: z.string().optional().nullable(),
  unitOfMeasure: z.string().optional(),
  unit_of_measure: z.string().optional(),
  costPrice: z.coerce.number().nonnegative().optional(),
  cost_price: z.coerce.number().nonnegative().optional(),
  sellingPrice: z.coerce.number().nonnegative().optional(),
  selling_price: z.coerce.number().nonnegative().optional(),
  price: z.coerce.number().nonnegative().optional(),
  reorderPoint: z.coerce.number().int().nonnegative().optional(),
  reorder_point: z.coerce.number().int().nonnegative().optional(),
  reorderLevel: z.coerce.number().int().nonnegative().optional(),
  reorderQuantity: z.coerce.number().int().nonnegative().optional(),
  reorder_quantity: z.coerce.number().int().nonnegative().optional(),
  barcode: z.string().optional().nullable(),
  qrCode: z.string().optional().nullable(),
  qr_code: z.string().optional().nullable(),
  batchTracking: z.boolean().optional(),
  batch_tracking: z.boolean().optional(),
  expiryTracking: z.boolean().optional(),
  expiry_tracking: z.boolean().optional(),
  imageUrl: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  is_active: z.boolean().optional(),
  variants: z.array(variantSchema).optional()
});

const adjustStockSchema = z.object({
  warehouseId: z.string().uuid().optional(),
  warehouse_id: z.string().uuid().optional(),
  warehouse: z.string().optional(),
  quantity: z.coerce.number().int().positive(),
  type: z.enum(["add", "remove", "adjustment", "damage", "ADD", "REMOVE", "DAMAGED"]).default("adjustment"),
  reason: z.string().min(3),
  unitCost: z.coerce.number().nonnegative().optional(),
  unit_cost: z.coerce.number().nonnegative().optional()
});

function mapProduct(row: Record<string, unknown>) {
  const available = toInteger(row.available_quantity);
  const reorderPoint = toInteger(row.reorder_point);
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    category: row.category_name ?? "",
    brand: row.brand ?? "",
    supplierId: row.supplier_id,
    supplier: row.supplier_name ?? "",
    unitOfMeasure: row.unit_of_measure,
    costPrice: toNumber(row.cost_price),
    sellingPrice: toNumber(row.selling_price),
    price: toNumber(row.selling_price),
    reorderPoint,
    reorderLevel: reorderPoint,
    reorderQuantity: toInteger(row.reorder_quantity),
    barcode: row.barcode ?? "",
    qrCode: row.qr_code ?? "",
    batchTracking: row.batch_tracking,
    expiryTracking: row.expiry_tracking,
    imageUrl: row.image_url ?? "",
    image_url: row.image_url ?? "",
    variants: Array.isArray(row.variants) ? row.variants : [],
    isActive: row.is_active,
    stock: toInteger(row.stock_quantity),
    availableQuantity: available,
    reservedQuantity: toInteger(row.reserved_quantity),
    status: available <= reorderPoint ? "Low Stock" : "Healthy",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function resolveCategoryId(categoryId: string | null | undefined, categoryName: string | null | undefined) {
  if (categoryId) return categoryId;
  if (!categoryName) return null;
  const existing = await queryOne<{ id: string }>("select id from categories where lower(name) = lower($1)", [categoryName]);
  if (existing) return existing.id;
  const created = await queryOne<{ id: string }>("insert into categories (name) values ($1) returning id", [categoryName]);
  return created?.id ?? null;
}

async function resolveSupplierId(supplierId: string | null | undefined, supplierName: string | null | undefined) {
  if (supplierId) return supplierId;
  if (!supplierName) return null;
  const existing = await queryOne<{ id: string }>("select id from suppliers where lower(name) = lower($1)", [supplierName]);
  if (existing) return existing.id;
  const created = await queryOne<{ id: string }>("insert into suppliers (name) values ($1) returning id", [supplierName]);
  return created?.id ?? null;
}

productsRouter.get(
  "/",
  requirePermission("products:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "created_at");
    const filters = ["p.is_active = true"];
    const params: unknown[] = [];

    if (list.search) {
      params.push(`%${list.search}%`);
      filters.push(`(p.sku ilike $${params.length} or p.name ilike $${params.length} or coalesce(p.description, '') ilike $${params.length})`);
    }
    if (req.query.categoryId) {
      params.push(req.query.categoryId);
      filters.push(`p.category_id = $${params.length}`);
    } else if (req.query.category && req.query.category !== "All") {
      params.push(req.query.category);
      filters.push(`c.name = $${params.length}`);
    }
    if (req.query.supplierId) {
      params.push(req.query.supplierId);
      filters.push(`p.supplier_id = $${params.length}`);
    }
    if (req.query.warehouseId) {
      params.push(req.query.warehouseId);
      filters.push(`i.warehouse_id = $${params.length}`);
    }

    const having = String(req.query.lowStock ?? req.query.low_stock ?? "false") === "true"
      ? "having coalesce(sum(i.available_quantity), 0) <= p.reorder_point"
      : "";
    const orderBy = sqlSort(
      list.sort,
      list.order,
      { name: "p.name", sku: "p.sku", created_at: "p.created_at", selling_price: "p.selling_price" },
      "created_at"
    );

    const rows = await query(
      `select p.*, c.name as category_name, s.name as supplier_name,
              coalesce(sum(i.quantity), 0)::int as stock_quantity,
              coalesce(sum(i.available_quantity), 0)::int as available_quantity,
              coalesce(sum(i.reserved_quantity), 0)::int as reserved_quantity,
              count(*) over() as full_count
         from products p
         left join categories c on c.id = p.category_id
         left join suppliers s on s.id = p.supplier_id
         left join inventory i on i.product_id = p.id
        where ${filters.join(" and ")}
        group by p.id, c.name, s.name
        ${having}
        order by ${orderBy}
        limit $${params.length + 1} offset $${params.length + 2}`,
      [...params, list.limit, list.offset]
    );

    const total = rows.length ? toInteger(rows[0].full_count) : 0;
    return paginated(res, rows.map(mapProduct), { page: list.page, limit: list.limit, total });
  })
);

productsRouter.post(
  "/",
  requireMinimumRole("manager"),
  validateBody(productSchema),
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = req.body as z.infer<typeof productSchema>;
    const categoryId = await resolveCategoryId(body.categoryId ?? body.category_id, body.category ?? null);
    const supplierId = await resolveSupplierId(body.supplierId ?? body.supplier_id, body.supplier ?? null);

    const product = await transaction(async (client) => {
      const inserted = await client.query(
        `insert into products (
          sku, name, description, category_id, supplier_id, unit_of_measure, cost_price,
          selling_price, reorder_point, reorder_quantity, barcode, qr_code, batch_tracking,
          expiry_tracking, image_url, is_active
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        returning *`,
        [
          body.sku,
          body.name,
          body.description ?? null,
          categoryId,
          supplierId,
          body.unitOfMeasure ?? body.unit_of_measure ?? "unit",
          body.costPrice ?? body.cost_price ?? 0,
          body.sellingPrice ?? body.selling_price ?? body.price ?? 0,
          body.reorderPoint ?? body.reorder_point ?? body.reorderLevel ?? 0,
          body.reorderQuantity ?? body.reorder_quantity ?? 0,
          body.barcode ?? null,
          body.qrCode ?? body.qr_code ?? body.sku,
          body.batchTracking ?? body.batch_tracking ?? false,
          body.expiryTracking ?? body.expiry_tracking ?? false,
          body.imageUrl ?? body.image_url ?? null,
          body.isActive ?? body.is_active ?? true
        ]
      );

      for (const variant of body.variants ?? []) {
        await client.query(
          `insert into product_variants (product_id, variant_name, sku_suffix, attributes, cost_price, selling_price, barcode, is_active)
           values ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            inserted.rows[0].id,
            variant.variantName ?? variant.variant_name ?? "Default",
            variant.skuSuffix ?? variant.sku_suffix ?? "DEFAULT",
            JSON.stringify(variant.attributes ?? {}),
            variant.costPrice ?? variant.cost_price ?? null,
            variant.sellingPrice ?? variant.selling_price ?? null,
            variant.barcode ?? null,
            variant.isActive ?? variant.is_active ?? true
          ]
        );
      }

      return inserted.rows[0];
    });

    return created(res, mapProduct({ ...product, category_name: body.category, supplier_name: body.supplier }), "Product created");
  })
);

productsRouter.post(
  "/import",
  requireMinimumRole("manager"),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: "CSV file is required" });
    const text = req.file.buffer.toString("utf8");
    const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
    const headers = headerLine.split(",").map((h) => h.trim());
    let imported = 0;
    for (const line of lines) {
      const values = line.split(",").map((v) => v.trim());
      const row = Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
      if (!row.sku || !row.name) continue;
      await query(
        `insert into products (sku, name, cost_price, selling_price, reorder_point)
         values ($1, $2, $3, $4, $5)
         on conflict (sku) do update
           set name = excluded.name,
               cost_price = excluded.cost_price,
               selling_price = excluded.selling_price,
               reorder_point = excluded.reorder_point`,
        [row.sku, row.name, Number(row.cost_price ?? row.costPrice ?? 0), Number(row.selling_price ?? row.price ?? 0), Number(row.reorder_point ?? row.reorderLevel ?? 0)]
      );
      imported += 1;
    }
    return ok(res, { imported }, "Products imported");
  })
);

productsRouter.get(
  "/:id",
  requirePermission("products:read"),
  asyncHandler(async (req, res) => {
    const product = await queryOne(
      `select p.*, c.name as category_name, s.name as supplier_name,
              coalesce(sum(i.quantity), 0)::int as stock_quantity,
              coalesce(sum(i.available_quantity), 0)::int as available_quantity,
              coalesce(sum(i.reserved_quantity), 0)::int as reserved_quantity
         from products p
         left join categories c on c.id = p.category_id
         left join suppliers s on s.id = p.supplier_id
         left join inventory i on i.product_id = p.id
        where p.id = $1
        group by p.id, c.name, s.name`,
      [req.params.id]
    );
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    const [variants, stock, movements] = await Promise.all([
      query("select * from product_variants where product_id = $1 order by variant_name", [req.params.id]),
      query(
        `select i.*, w.name as warehouse_name
           from inventory i
           join warehouses w on w.id = i.warehouse_id
          where i.product_id = $1
          order by w.name`,
        [req.params.id]
      ),
      query(
        `select sm.*, w.name as warehouse_name, u.name as created_by_name
           from stock_movements sm
           join warehouses w on w.id = sm.warehouse_id
           left join users u on u.id = sm.created_by
          where sm.product_id = $1
          order by sm.created_at desc
          limit 25`,
        [req.params.id]
      )
    ]);
    return ok(res, {
      ...mapProduct(product),
      variants,
      stockByWarehouse: stock.map((row) => ({
        id: row.id,
        warehouseId: row.warehouse_id,
        warehouse: row.warehouse_name,
        quantity: toInteger(row.quantity),
        reservedQuantity: toInteger(row.reserved_quantity),
        availableQuantity: toInteger(row.available_quantity),
        batchNumber: row.batch_number,
        expiryDate: dateOnly(row.expiry_date)
      })),
      movementHistory: movements
    });
  })
);

productsRouter.put(
  "/:id",
  requireMinimumRole("manager"),
  validateBody(productSchema.partial()),
  asyncHandler(async (req, res) => {
    const body = req.body as Partial<z.infer<typeof productSchema>>;
    const categoryId = await resolveCategoryId(body.categoryId ?? body.category_id, body.category ?? null);
    const supplierId = await resolveSupplierId(body.supplierId ?? body.supplier_id, body.supplier ?? null);
    const row = await queryOne(
      `update products
          set sku = coalesce($2, sku),
              name = coalesce($3, name),
              description = coalesce($4, description),
              category_id = coalesce($5, category_id),
              supplier_id = coalesce($6, supplier_id),
              unit_of_measure = coalesce($7, unit_of_measure),
              cost_price = coalesce($8, cost_price),
              selling_price = coalesce($9, selling_price),
              reorder_point = coalesce($10, reorder_point),
              reorder_quantity = coalesce($11, reorder_quantity),
              barcode = coalesce($12, barcode),
              qr_code = coalesce($13, qr_code),
              batch_tracking = coalesce($14, batch_tracking),
              expiry_tracking = coalesce($15, expiry_tracking),
              image_url = coalesce($16, image_url),
              is_active = coalesce($17, is_active)
        where id = $1
        returning *`,
      [
        req.params.id,
        body.sku ?? null,
        body.name ?? null,
        body.description ?? null,
        categoryId,
        supplierId,
        body.unitOfMeasure ?? body.unit_of_measure ?? null,
        body.costPrice ?? body.cost_price ?? null,
        body.sellingPrice ?? body.selling_price ?? body.price ?? null,
        body.reorderPoint ?? body.reorder_point ?? body.reorderLevel ?? null,
        body.reorderQuantity ?? body.reorder_quantity ?? null,
        body.barcode ?? null,
        body.qrCode ?? body.qr_code ?? null,
        body.batchTracking ?? body.batch_tracking ?? null,
        body.expiryTracking ?? body.expiry_tracking ?? null,
        body.imageUrl ?? body.image_url ?? null,
        body.isActive ?? body.is_active ?? null
      ]
    );
    if (!row) return res.status(404).json({ success: false, message: "Product not found" });
    return ok(res, mapProduct(row), "Product updated");
  })
);

productsRouter.delete(
  "/:id",
  requireMinimumRole("manager"),
  asyncHandler(async (req, res) => {
    await query("update products set is_active = false where id = $1", [req.params.id]);
    return noContent(res);
  })
);

productsRouter.get(
  "/:id/stock",
  requirePermission("products:read"),
  asyncHandler(async (req, res) => {
    const rows = await query(
      `select i.*, w.name as warehouse_name, w.city
         from inventory i
         join warehouses w on w.id = i.warehouse_id
        where i.product_id = $1
        order by w.name`,
      [req.params.id]
    );
    return ok(
      res,
      rows.map((row) => ({
        id: row.id,
        warehouseId: row.warehouse_id,
        warehouse: row.warehouse_name,
        city: row.city,
        quantity: toInteger(row.quantity),
        reservedQuantity: toInteger(row.reserved_quantity),
        availableQuantity: toInteger(row.available_quantity),
        batchNumber: row.batch_number,
        expiryDate: dateOnly(row.expiry_date)
      }))
    );
  })
);

productsRouter.get(
  "/:id/movements",
  requirePermission("products:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "created_at");
    const count = await queryOne<{ count: string }>("select count(*) from stock_movements where product_id = $1", [req.params.id]);
    const rows = await query(
      `select sm.*, w.name as warehouse_name, u.name as created_by_name
         from stock_movements sm
         join warehouses w on w.id = sm.warehouse_id
         left join users u on u.id = sm.created_by
        where sm.product_id = $1
        order by sm.created_at desc
        limit $2 offset $3`,
      [req.params.id, list.limit, list.offset]
    );
    return paginated(res, rows, { page: list.page, limit: list.limit, total: toInteger(count?.count) });
  })
);

productsRouter.post(
  "/:id/adjust-stock",
  requireMinimumRole("staff"),
  validateBody(adjustStockSchema),
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = req.body as z.infer<typeof adjustStockSchema>;
    let warehouseId = body.warehouseId ?? body.warehouse_id;
    if (!warehouseId && body.warehouse) {
      const warehouse = await queryOne<{ id: string }>("select id from warehouses where name = $1", [body.warehouse]);
      warehouseId = warehouse?.id;
    }
    if (!warehouseId) return res.status(400).json({ success: false, message: "warehouseId is required" });

    const type = body.type.toLowerCase();
    const delta = type === "add" ? body.quantity : -body.quantity;
    const movementType = type === "damage" || type === "damaged" ? "damage" : "adjustment";

    const productId = String(req.params.id);
    const updated = await transaction((client) =>
      adjustInventory(client, {
        productId,
        warehouseId,
        quantityDelta: delta,
        movementType,
        movementQuantity: body.quantity,
        referenceType: "manual_adjustment",
        unitCost: body.unitCost ?? body.unit_cost ?? null,
        notes: body.reason,
        userId: req.user?.id ?? null,
        io: req.app.get("io")
      })
    );
    return ok(res, updated, "Stock adjusted");
  })
);

productsRouter.post("/:id/images", requireMinimumRole("manager"), upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "Missing image file" });
  return res.status(201).json({
    success: true,
    message: "Image accepted",
    data: {
      filename: req.file.originalname,
      size: req.file.size,
      url: `/uploads/${req.params.id}/${req.file.originalname}`
    }
  });
});
