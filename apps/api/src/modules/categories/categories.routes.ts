import { Router } from "express";

import { prisma } from "../../db/prisma.js";
import { requireMinimumRole, requirePermission } from "../../middleware/rbac.js";
import { asyncHandler, created, noContent, ok } from "../../utils/http.js";

export const categoriesRouter = Router();

categoriesRouter.get(
  "/",
  requirePermission("products:read"),
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } }
      },
      orderBy: { name: "asc" }
    });

    return ok(
      res,
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        parentId: c.parentId,
        productCount: c._count.products,
        createdAt: c.createdAt
      }))
    );
  })
);

categoriesRouter.post(
  "/",
  requireMinimumRole("manager"),
  asyncHandler(async (req, res) => {
    const { name, description, parentId } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Name is required" });

    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) return res.status(409).json({ success: false, message: "Category already exists" });

    const category = await prisma.category.create({
      data: { name, description: description ?? null, parentId: parentId ?? null }
    });

    return created(res, { ...category, productCount: 0 });
  })
);

categoriesRouter.put(
  "/:id",
  requireMinimumRole("manager"),
  asyncHandler(async (req, res) => {
    const { name, description, parentId } = req.body;
    const category = await prisma.category.update({
      where: { id: String(req.params.id) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(parentId !== undefined && { parentId })
      }
    });
    return ok(res, category, "Category updated");
  })
);

categoriesRouter.delete(
  "/:id",
  requireMinimumRole("manager"),
  asyncHandler(async (req, res) => {
    const productsCount = await prisma.product.count({ where: { categoryId: String(req.params.id) } });
    if (productsCount > 0) {
      return res.status(400).json({ success: false, message: "Cannot delete category with products" });
    }

    await prisma.category.delete({ where: { id: String(req.params.id) } });
    return noContent(res);
  })
);
