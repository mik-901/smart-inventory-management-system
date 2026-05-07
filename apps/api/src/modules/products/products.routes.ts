import { Router } from "express";
import multer from "multer";

import { demoStore } from "../../data/demo-store.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { productSchema } from "../../validators/schemas.js";
import { writeAudit } from "../../utils/audit.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { pool, query } from "../../db/pool.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const productsRouter = Router();

function mapProduct(row: any) {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    brand: row.brand,
    price: parseFloat(row.price),
    costPrice: parseFloat(row.cost_price),
    barcode: row.barcode,
    variants: typeof row.variants === "string" ? JSON.parse(row.variants) : row.variants,
    batchNumber: row.batch_number,
    expiryDate: row.expiry_date,
    reorderLevel: row.reorder_level,
    supplier: row.supplier,
    imageUrl: row.image_url,
    stock: row.stock,
    status: row.status
  };
}

productsRouter.get("/", requirePermission("products:read"), async (req, res) => {
  const search = String(req.query.q ?? "").toLowerCase();
  const category = String(req.query.category ?? "");

  if (pool) {
    let sql = "SELECT * FROM products WHERE is_active = true";
    const params: any[] = [];
    if (category && category !== "All") {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(sku) LIKE $${params.length} OR LOWER(brand) LIKE $${params.length})`;
    }
    sql += " ORDER BY created_at DESC";

    try {
      const rows = await query(sql, params);
      return res.json({ data: rows.map(mapProduct) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
  }

  const data = demoStore.products.filter((product) => {
    const matchesQuery = [product.name, product.sku, product.brand, product.supplier].join(" ").toLowerCase().includes(search);
    const matchesCategory = !category || category === "All" || product.category === category;
    return matchesQuery && matchesCategory;
  });
  res.json({ data });
});

productsRouter.post("/", requirePermission("products:write"), validateBody(productSchema), async (req: AuthRequest, res) => {
  const { name, sku, category, brand, price, costPrice, barcode, variants, batchNumber, expiryDate, reorderLevel, supplier, imageUrl } = req.body;
  
  if (pool) {
    try {
      const rows = await query(
        `INSERT INTO products (name, sku, category, brand, price, cost_price, barcode, variants, batch_number, expiry_date, reorder_level, supplier, image_url, stock, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0, 'Low Stock') RETURNING *`,
        [name, sku, category, brand, price, costPrice, barcode, JSON.stringify(variants), batchNumber, expiryDate, reorderLevel, supplier, imageUrl]
      );
      writeAudit(req, "created product", sku);
      return res.status(201).json({ data: mapProduct(rows[0]) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create product" });
    }
  }

  const product = {
    id: crypto.randomUUID(),
    ...req.body,
    stock: 0,
    status: "Low Stock"
  };
  demoStore.products.unshift(product);
  writeAudit(req, "created product", product.sku);
  res.status(201).json({ data: product });
});

productsRouter.patch("/:id", requirePermission("products:write"), async (req: AuthRequest, res) => {
  if (pool) {
    try {
      const updates = Object.entries(req.body).filter(([k]) => k !== "id");
      if (updates.length === 0) return res.json({ data: {} });
      
      const setClause = updates.map(([k], i) => {
        const col = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        return `${col} = $${i + 1}`;
      }).join(", ");
      const values = updates.map(([, v]) => Array.isArray(v) ? JSON.stringify(v) : v);
      
      const rows = await query(`UPDATE products SET ${setClause}, updated_at = now() WHERE id = $${values.length + 1} RETURNING *`, [...values, req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: "Product not found" });
      
      writeAudit(req, "updated product", rows[0].sku);
      return res.json({ data: mapProduct(rows[0]) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to update product" });
    }
  }

  const index = demoStore.products.findIndex((product) => product.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Product not found" });
  demoStore.products[index] = { ...demoStore.products[index], ...req.body };
  writeAudit(req, "updated product", demoStore.products[index].sku);
  res.json({ data: demoStore.products[index] });
});

productsRouter.delete("/:id", requirePermission("products:write"), async (req: AuthRequest, res) => {
  if (pool) {
    try {
      const rows = await query("DELETE FROM products WHERE id = $1 RETURNING sku", [req.params.id]);
      if (rows.length > 0) writeAudit(req, "deleted product", rows[0].sku);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete product" });
    }
  }

  const index = demoStore.products.findIndex((product) => product.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Product not found" });
  const [deleted] = demoStore.products.splice(index, 1);
  writeAudit(req, "deleted product", deleted.sku);
  res.status(204).send();
});

productsRouter.post("/:id/images", requirePermission("products:write"), upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Missing image file" });
  res.status(201).json({
    data: {
      filename: req.file.originalname,
      size: req.file.size,
      url: `/uploads/${req.params.id}/${req.file.originalname}`
    }
  });
});
