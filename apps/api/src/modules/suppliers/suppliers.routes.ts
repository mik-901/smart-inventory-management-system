import { Router } from "express";
import { z } from "zod";

import { query, queryOne } from "../../db/pool.js";
import { requireMinimumRole, requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler, created, noContent, ok, paginated } from "../../utils/http.js";
import { parseListQuery, sqlSort } from "../../utils/pagination.js";
import { toInteger, toNumber } from "../../utils/serializers.js";

export const suppliersRouter = Router();

const supplierSchema = z.object({
  name: z.string().min(2),
  contactPerson: z.string().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().default("India"),
  paymentTerms: z.string().optional().nullable(),
  payment_terms: z.string().optional().nullable(),
  leadTimeDays: z.coerce.number().int().nonnegative().default(7),
  lead_time_days: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
  is_active: z.boolean().optional()
});

function mapSupplier(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    country: row.country,
    paymentTerms: row.payment_terms,
    leadTimeDays: toInteger(row.lead_time_days),
    isActive: row.is_active,
    totalPurchased: toNumber(row.total_purchased),
    openOrders: toInteger(row.open_orders),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

suppliersRouter.get(
  "/",
  requirePermission("products:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "name");
    const filters: string[] = [];
    const params: unknown[] = [];
    if (list.search) {
      params.push(`%${list.search}%`);
      filters.push(`(s.name ilike $${params.length} or coalesce(s.contact_person, '') ilike $${params.length} or coalesce(s.email, '') ilike $${params.length})`);
    }
    const where = filters.length ? `where ${filters.join(" and ")}` : "";
    const orderBy = sqlSort(list.sort, list.order, { name: "s.name", city: "s.city", created_at: "s.created_at" }, "name");
    const count = await queryOne<{ count: string }>(`select count(*) from suppliers s ${where}`, params);
    const rows = await query(
      `select s.*,
              coalesce(sum(po.total_amount), 0) as total_purchased,
              count(po.id) filter (where po.status in ('draft', 'sent', 'confirmed')) as open_orders
         from suppliers s
         left join purchase_orders po on po.supplier_id = s.id
         ${where}
        group by s.id
        order by ${orderBy}
        limit $${params.length + 1} offset $${params.length + 2}`,
      [...params, list.limit, list.offset]
    );
    return paginated(res, rows.map(mapSupplier), { page: list.page, limit: list.limit, total: toInteger(count?.count) });
  })
);

suppliersRouter.post(
  "/",
  requireMinimumRole("manager"),
  validateBody(supplierSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof supplierSchema>;
    const row = await queryOne(
      `insert into suppliers (name, contact_person, email, phone, address, city, country, payment_terms, lead_time_days, is_active)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       returning *`,
      [
        body.name,
        body.contactPerson ?? body.contact_person ?? null,
        body.email ?? null,
        body.phone ?? null,
        body.address ?? null,
        body.city ?? null,
        body.country,
        body.paymentTerms ?? body.payment_terms ?? null,
        body.leadTimeDays ?? body.lead_time_days ?? 7,
        body.isActive ?? body.is_active ?? true
      ]
    );
    return created(res, mapSupplier(row ?? {}), "Supplier created");
  })
);

suppliersRouter.get(
  "/:id",
  requirePermission("products:read"),
  asyncHandler(async (req, res) => {
    const supplier = await queryOne("select * from suppliers where id = $1", [req.params.id]);
    if (!supplier) return res.status(404).json({ success: false, message: "Supplier not found" });
    const history = await query(
      `select po.id, po.po_number, po.status, po.order_date, po.expected_date, po.received_date, po.total_amount,
              w.name as warehouse_name
         from purchase_orders po
         join warehouses w on w.id = po.warehouse_id
        where po.supplier_id = $1
        order by po.order_date desc`,
      [req.params.id]
    );
    return ok(res, { ...mapSupplier(supplier), purchaseHistory: history });
  })
);

suppliersRouter.put(
  "/:id",
  requireMinimumRole("manager"),
  validateBody(supplierSchema.partial()),
  asyncHandler(async (req, res) => {
    const body = req.body as Partial<z.infer<typeof supplierSchema>>;
    const row = await queryOne(
      `update suppliers
          set name = coalesce($2, name),
              contact_person = coalesce($3, contact_person),
              email = coalesce($4, email),
              phone = coalesce($5, phone),
              address = coalesce($6, address),
              city = coalesce($7, city),
              country = coalesce($8, country),
              payment_terms = coalesce($9, payment_terms),
              lead_time_days = coalesce($10, lead_time_days),
              is_active = coalesce($11, is_active)
        where id = $1
        returning *`,
      [
        req.params.id,
        body.name ?? null,
        body.contactPerson ?? body.contact_person ?? null,
        body.email ?? null,
        body.phone ?? null,
        body.address ?? null,
        body.city ?? null,
        body.country ?? null,
        body.paymentTerms ?? body.payment_terms ?? null,
        body.leadTimeDays ?? body.lead_time_days ?? null,
        body.isActive ?? body.is_active ?? null
      ]
    );
    if (!row) return res.status(404).json({ success: false, message: "Supplier not found" });
    return ok(res, mapSupplier(row), "Supplier updated");
  })
);

suppliersRouter.delete(
  "/:id",
  requireMinimumRole("manager"),
  asyncHandler(async (req, res) => {
    await query("update suppliers set is_active = false where id = $1", [req.params.id]);
    return noContent(res);
  })
);
