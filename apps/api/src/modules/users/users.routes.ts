import { Router } from "express";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";

import { query, queryOne } from "../../db/pool.js";
import { requireAdmin } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler, created, noContent, ok, paginated } from "../../utils/http.js";
import { parseListQuery } from "../../utils/pagination.js";
import { toInteger } from "../../utils/serializers.js";

export const usersRouter = Router();

const scryptAsync = promisify(scrypt);

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: z.enum(["admin", "manager", "staff", "viewer"]).default("viewer"),
  isActive: z.boolean().optional(),
  is_active: z.boolean().optional()
});

const passwordSchema = z.object({
  password: z.string().min(8)
});

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

function mapUser(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    status: row.is_active ? "Active" : "Suspended",
    lastLogin: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

usersRouter.get(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "created_at");
    const filters: string[] = [];
    const params: unknown[] = [];
    if (list.search) {
      params.push(`%${list.search}%`);
      filters.push(`(name ilike $${params.length} or email ilike $${params.length})`);
    }
    const where = filters.length ? `where ${filters.join(" and ")}` : "";
    const count = await queryOne<{ count: string }>(`select count(*) from users ${where}`, params);
    const rows = await query(
      `select id, name, email, role, is_active, last_login_at, created_at, updated_at
         from users
         ${where}
        order by created_at desc
        limit $${params.length + 1} offset $${params.length + 2}`,
      [...params, list.limit, list.offset]
    );
    return paginated(res, rows.map(mapUser), { page: list.page, limit: list.limit, total: toInteger(count?.count) });
  })
);

usersRouter.post(
  "/",
  requireAdmin,
  validateBody(userSchema.required({ password: true })),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof userSchema> & { password: string };
    const row = await queryOne(
      `insert into users (name, email, password_hash, role, is_active)
       values ($1, lower($2), $3, $4, $5)
       returning id, name, email, role, is_active, last_login_at, created_at, updated_at`,
      [body.name, body.email, await hashPassword(body.password), body.role, body.isActive ?? body.is_active ?? true]
    );
    return created(res, mapUser(row ?? {}), "User created");
  })
);

usersRouter.get(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const row = await queryOne("select id, name, email, role, is_active, last_login_at, created_at, updated_at from users where id = $1", [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: "User not found" });
    return ok(res, mapUser(row));
  })
);

usersRouter.put(
  "/:id",
  requireAdmin,
  validateBody(userSchema.partial()),
  asyncHandler(async (req, res) => {
    const body = req.body as Partial<z.infer<typeof userSchema>>;
    const row = await queryOne(
      `update users
          set name = coalesce($2, name),
              email = coalesce(lower($3), email),
              role = coalesce($4, role),
              is_active = coalesce($5, is_active)
        where id = $1
        returning id, name, email, role, is_active, last_login_at, created_at, updated_at`,
      [req.params.id, body.name ?? null, body.email ?? null, body.role ?? null, body.isActive ?? body.is_active ?? null]
    );
    if (!row) return res.status(404).json({ success: false, message: "User not found" });
    return ok(res, mapUser(row), "User updated");
  })
);

usersRouter.patch(
  "/:id/password",
  requireAdmin,
  validateBody(passwordSchema),
  asyncHandler(async (req, res) => {
    await query("update users set password_hash = $2 where id = $1", [req.params.id, await hashPassword(req.body.password)]);
    return ok(res, { id: req.params.id }, "Password updated");
  })
);

usersRouter.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await query("update users set is_active = false where id = $1", [req.params.id]);
    return noContent(res);
  })
);
