import { Router } from "express";

import { prisma } from "../../db/prisma.js";
import { requirePermission } from "../../middleware/rbac.js";
import { asyncHandler, ok, paginated } from "../../utils/http.js";
import { parseListQuery } from "../../utils/pagination.js";

export const ordersRouter = Router();

ordersRouter.get(
  "/",
  requirePermission("orders:read"),
  asyncHandler(async (req, res) => {
    const list = parseListQuery(req, "order_date");
    const typeFilter = String(req.query.type ?? "").toLowerCase();

    const results: any[] = [];

    if (!typeFilter || typeFilter === "purchase") {
      const pos = await prisma.purchaseOrder.findMany({
        include: { supplier: { select: { name: true } }, warehouse: { select: { name: true } } },
        orderBy: { orderDate: "desc" },
        take: list.limit
      });
      results.push(...pos.map((po) => ({
        id: po.id, type: "Purchase", number: po.poNumber, party: po.supplier?.name ?? "",
        warehouse: po.warehouse?.name ?? "", status: po.status, amount: po.totalAmount,
        date: po.orderDate, createdAt: po.createdAt
      })));
    }

    if (!typeFilter || typeFilter === "sales") {
      const sos = await prisma.salesOrder.findMany({
        include: { warehouse: { select: { name: true } } },
        orderBy: { orderDate: "desc" },
        take: list.limit
      });
      results.push(...sos.map((so) => ({
        id: so.id, type: "Sales", number: so.soNumber, party: so.customerName,
        warehouse: so.warehouse?.name ?? "", status: so.status, amount: so.totalAmount,
        date: so.orderDate, createdAt: so.createdAt
      })));
    }

    if (!typeFilter || typeFilter === "transfer") {
      const transfers = await prisma.transfer.findMany({
        include: {
          fromWarehouse: { select: { name: true } },
          toWarehouse: { select: { name: true } }
        },
        orderBy: { transferDate: "desc" },
        take: list.limit
      });
      results.push(...transfers.map((t) => ({
        id: t.id, type: "Transfer", number: t.transferNumber,
        party: `${t.fromWarehouse?.name} → ${t.toWarehouse?.name}`,
        warehouse: t.fromWarehouse?.name ?? "", status: t.status, amount: 0,
        date: t.transferDate, createdAt: t.createdAt
      })));
    }

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = results.length;
    const paged = results.slice(list.offset, list.offset + list.limit);

    return paginated(res, paged, { page: list.page, limit: list.limit, total });
  })
);
