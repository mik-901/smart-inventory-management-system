import { Router } from "express";
import { z } from "zod";

import { query, queryOne } from "../../db/pool.js";
import { requireMinimumRole, requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler, created, noContent, ok } from "../../utils/http.js";

export const categoriesRouter = Router();

const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  parent_id: z.string().uuid().optional().nullable()
});

function buildTree(rows: Array<Record<string, unknown>>) {
  const nodes = new Map<string, Record<string, unknown> & { children: unknown[] }>();
  for (const row of rows) nodes.set(String(row.id), { ...row, parentId: row.parent_id, createdAt: row.created_at, children: [] });
  const tree: Array<Record<string, unknown>> = [];
  for (const node of nodes.values()) {
    const parentId = node.parent_id ? String(node.parent_id) : null;
    if (parentId && nodes.has(parentId)) nodes.get(parentId)?.children.push(node);
    else tree.push(node);
  }
  return tree;
}

categoriesRouter.get(
  "/",
  requirePermission("products:read"),
  asyncHandler(async (_req, res) => {
    const rows = await query("select * from categories order by name");
    return ok(res, buildTree(rows));
  })
);

categoriesRouter.post(
  "/",
  requireMinimumRole("manager"),
  validateBody(categorySchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof categorySchema>;
    const row = await queryOne(
      `insert into categories (name, description, parent_id)
       values ($1, $2, $3)
       returning *`,
      [body.name, body.description ?? null, body.parentId ?? body.parent_id ?? null]
    );
    return created(res, row, "Category created");
  })
);

categoriesRouter.put(
  "/:id",
  requireMinimumRole("manager"),
  validateBody(categorySchema.partial()),
  asyncHandler(async (req, res) => {
    const body = req.body as Partial<z.infer<typeof categorySchema>>;
    const row = await queryOne(
      `update categories
          set name = coalesce($2, name),
              description = coalesce($3, description),
              parent_id = $4
        where id = $1
        returning *`,
      [req.params.id, body.name ?? null, body.description ?? null, body.parentId ?? body.parent_id ?? null]
    );
    if (!row) return res.status(404).json({ success: false, message: "Category not found" });
    return ok(res, row, "Category updated");
  })
);

categoriesRouter.delete(
  "/:id",
  requireMinimumRole("manager"),
  asyncHandler(async (req, res) => {
    await query("delete from categories where id = $1", [req.params.id]);
    return noContent(res);
  })
);
