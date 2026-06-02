import { Router } from "express";

import { prisma } from "../../db/prisma.js";
import { requireMinimumRole, requirePermission } from "../../middleware/rbac.js";
import { asyncHandler, created, noContent, ok, paginated } from "../../utils/http.js";
import { parseListQuery } from "../../utils/pagination.js";

export const suppliersRouter = Router();

suppliersRouter.get(
  "/",
  requirePermission("products:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "name");
    const where: any = {};
    if (req.query.active !== undefined) where.isActive = req.query.active === "true";
    if (list.search) where.name = { contains: list.search };

    const [total, suppliers] = await Promise.all([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({
        where,
        include: { _count: { select: { products: true } } },
        orderBy: { name: "asc" },
        take: list.limit,
        skip: list.offset
      })
    ]);

    return paginated(
      res,
      suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        contactPerson: s.contactPerson,
        email: s.email,
        phone: s.phone,
        address: s.address,
        city: s.city,
        country: s.country,
        paymentTerms: s.paymentTerms,
        leadTimeDays: s.leadTimeDays,
        isActive: s.isActive,
        productCount: s._count.products,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      })),
      { page: list.page, limit: list.limit, total }
    );
  })
);

suppliersRouter.post(
  "/",
  requireMinimumRole("manager"),
  asyncHandler(async (req, res) => {
    const body = req.body;
    if (!body.name) return res.status(400).json({ success: false, message: "Name is required" });

    const supplier = await prisma.supplier.create({
      data: {
        name: body.name,
        contactPerson: body.contactPerson ?? body.contact_person ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        address: body.address ?? null,
        city: body.city ?? null,
        country: body.country ?? "India",
        paymentTerms: body.paymentTerms ?? body.payment_terms ?? null,
        leadTimeDays: Number(body.leadTimeDays ?? body.lead_time_days ?? 7)
      }
    });

    return created(res, { ...supplier, productCount: 0 });
  })
);

suppliersRouter.put(
  "/:id",
  requireMinimumRole("manager"),
  asyncHandler(async (req, res) => {
    const body = req.body;
    const supplier = await prisma.supplier.update({
      where: { id: String(req.params.id) },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.contactPerson ?? body.contact_person ? { contactPerson: body.contactPerson ?? body.contact_person } : {}),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.country && { country: body.country }),
        ...(body.paymentTerms ?? body.payment_terms ? { paymentTerms: body.paymentTerms ?? body.payment_terms } : {}),
        ...(body.leadTimeDays ?? body.lead_time_days ? { leadTimeDays: Number(body.leadTimeDays ?? body.lead_time_days) } : {}),
        ...(body.isActive !== undefined && { isActive: body.isActive })
      }
    });
    return ok(res, supplier, "Supplier updated");
  })
);

suppliersRouter.delete(
  "/:id",
  requireMinimumRole("manager"),
  asyncHandler(async (req, res) => {
    await prisma.supplier.update({ where: { id: String(req.params.id) }, data: { isActive: false } });
    return noContent(res);
  })
);
