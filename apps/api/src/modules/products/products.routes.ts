import { Router } from "express";
import multer from "multer";

import { demoStore } from "../../data/demo-store.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { productSchema } from "../../validators/schemas.js";
import { writeAudit } from "../../utils/audit.js";
import type { AuthRequest } from "../../middleware/auth.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const productsRouter = Router();

productsRouter.get("/", requirePermission("products:read"), (req, res) => {
  const query = String(req.query.q ?? "").toLowerCase();
  const category = String(req.query.category ?? "");
  const data = demoStore.products.filter((product) => {
    const matchesQuery = [product.name, product.sku, product.brand, product.supplier].join(" ").toLowerCase().includes(query);
    const matchesCategory = !category || category === "All" || product.category === category;
    return matchesQuery && matchesCategory;
  });
  res.json({ data });
});

productsRouter.post("/", requirePermission("products:write"), validateBody(productSchema), (req: AuthRequest, res) => {
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

productsRouter.patch("/:id", requirePermission("products:write"), (req: AuthRequest, res) => {
  const index = demoStore.products.findIndex((product) => product.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Product not found" });
  demoStore.products[index] = { ...demoStore.products[index], ...req.body };
  writeAudit(req, "updated product", demoStore.products[index].sku);
  res.json({ data: demoStore.products[index] });
});

productsRouter.delete("/:id", requirePermission("products:write"), (req: AuthRequest, res) => {
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
