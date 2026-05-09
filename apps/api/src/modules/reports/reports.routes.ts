import { Router } from "express";
import { stringify } from "csv-stringify/sync";
import ExcelJS from "exceljs";

import { query } from "../../db/pool.js";
import { requirePermission } from "../../middleware/rbac.js";
import { asyncHandler, ok } from "../../utils/http.js";
import { toInteger, toNumber } from "../../utils/serializers.js";

export const reportsRouter = Router();

const reportDefinitions = [
  { report: "Stock valuation", owner: "Finance", endpoint: "/reports/stock-valuation", format: "CSV / Excel" },
  { report: "Movement history", owner: "Operations", endpoint: "/reports/movement-history", format: "CSV / Excel" },
  { report: "ABC analysis", owner: "Planning", endpoint: "/reports/abc-analysis", format: "JSON" },
  { report: "Dead stock", owner: "Procurement", endpoint: "/reports/dead-stock", format: "CSV / Excel" },
  { report: "Aging", owner: "Compliance", endpoint: "/reports/aging", format: "CSV / Excel" },
  { report: "Reorder suggestions", owner: "Procurement", endpoint: "/reports/reorder-suggestions", format: "JSON" }
];

async function stockValuationRows() {
  return query(
    `select p.sku, p.name as product, w.name as warehouse,
            coalesce(sum(i.quantity), 0)::int as quantity,
            p.cost_price,
            coalesce(sum(i.quantity * p.cost_price), 0) as value
       from inventory i
       join products p on p.id = i.product_id
       join warehouses w on w.id = i.warehouse_id
      group by p.id, w.id
      order by value desc`
  );
}

async function movementRows(filters: { from?: unknown; to?: unknown; productId?: unknown } = {}) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.from) {
    params.push(filters.from);
    where.push(`sm.created_at >= $${params.length}`);
  }
  if (filters.to) {
    params.push(filters.to);
    where.push(`sm.created_at <= $${params.length}`);
  }
  if (filters.productId) {
    params.push(filters.productId);
    where.push(`sm.product_id = $${params.length}`);
  }
  return query(
    `select sm.created_at, sm.movement_type, sm.quantity, sm.reference_type, sm.reference_id,
            p.sku, p.name as product, w.name as warehouse, u.name as created_by
       from stock_movements sm
       join products p on p.id = sm.product_id
       join warehouses w on w.id = sm.warehouse_id
       left join users u on u.id = sm.created_by
       ${where.length ? `where ${where.join(" and ")}` : ""}
      order by sm.created_at desc`,
    params
  );
}

async function exportRows(type: string, reqQuery: Record<string, unknown>) {
  if (type === "stock") return stockValuationRows();
  if (type === "movements") return movementRows({ from: reqQuery.from, to: reqQuery.to, productId: reqQuery.productId });
  if (type === "orders") {
    return query(
      `select 'purchase' as order_type, po_number as number, status, order_date, total_amount from purchase_orders
       union all
       select 'sales' as order_type, so_number as number, status, order_date, total_amount from sales_orders
       order by order_date desc`
    );
  }
  if (type === "returns") {
    return query("select return_number, reference_type, reason, status, total_items, created_at from returns order by created_at desc");
  }
  return stockValuationRows();
}

function sendExport(res: import("express").Response, rows: Array<Record<string, unknown>>, filename: string, format: string) {
  if (format === "xlsx" || format === "excel") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(filename);
    const columns = Object.keys(rows[0] ?? { message: "No data" });
    sheet.columns = columns.map((key) => ({ key, header: key, width: 24 }));
    rows.forEach((row) => sheet.addRow(row));
    sheet.getRow(1).font = { bold: true };
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);
    return workbook.xlsx.writeBuffer().then((buffer) => res.send(Buffer.from(buffer)));
  }

  const csv = stringify(rows, { header: true });
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
  return res.send(csv);
}

reportsRouter.get("/", requirePermission("reports:read"), (_req, res) => {
  return ok(res, reportDefinitions);
});

reportsRouter.get(
  "/stock-valuation",
  requirePermission("reports:read"),
  asyncHandler(async (_req, res) => {
    const rows = await stockValuationRows();
    return ok(
      res,
      rows.map((row) => ({ ...row, quantity: toInteger(row.quantity), costPrice: toNumber(row.cost_price), value: toNumber(row.value) }))
    );
  })
);

reportsRouter.get(
  "/movement-history",
  requirePermission("reports:read"),
  asyncHandler(async (req, res) => {
    return ok(res, await movementRows({ from: req.query.from, to: req.query.to, productId: req.query.productId }));
  })
);

reportsRouter.get(
  "/abc-analysis",
  requirePermission("reports:read"),
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `with revenue as (
         select p.id, p.sku, p.name, coalesce(sum(soi.total_price), 0) as revenue
           from products p
           left join sales_order_items soi on soi.product_id = p.id
           left join sales_orders so on so.id = soi.so_id and so.status in ('confirmed', 'shipped', 'delivered')
          group by p.id
       ), totals as (
         select *, sum(revenue) over () as grand_total,
                sum(revenue) over (order by revenue desc rows between unbounded preceding and current row) as cumulative
           from revenue
       )
       select sku, name, revenue, grand_total,
              case
                when grand_total = 0 then 'C'
                when cumulative / grand_total <= 0.8 then 'A'
                when cumulative / grand_total <= 0.95 then 'B'
                else 'C'
              end as class
         from totals
        order by revenue desc`
    );
    return ok(res, rows.map((row) => ({ ...row, revenue: toNumber(row.revenue), grandTotal: toNumber(row.grand_total) })));
  })
);

reportsRouter.get(
  "/dead-stock",
  requirePermission("reports:read"),
  asyncHandler(async (req, res) => {
    const days = Math.max(1, Number(req.query.days ?? 90));
    const rows = await query(
      `select p.sku, p.name as product, coalesce(sum(i.quantity), 0)::int as quantity,
              max(sm.created_at) as last_movement_at
         from products p
         left join inventory i on i.product_id = p.id
         left join stock_movements sm on sm.product_id = p.id
        where p.is_active = true
        group by p.id
       having max(sm.created_at) is null or max(sm.created_at) < now() - ($1::int * interval '1 day')
        order by quantity desc`,
      [days]
    );
    return ok(res, rows);
  })
);

reportsRouter.get(
  "/aging",
  requirePermission("reports:read"),
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `select p.sku, p.name as product, w.name as warehouse, i.batch_number, i.quantity,
              min(sm.created_at)::date as first_received_at,
              extract(day from now() - coalesce(min(sm.created_at), i.updated_at))::int as age_days
         from inventory i
         join products p on p.id = i.product_id
         join warehouses w on w.id = i.warehouse_id
         left join stock_movements sm on sm.product_id = i.product_id
          and sm.warehouse_id = i.warehouse_id
          and sm.movement_type in ('purchase', 'transfer_in', 'return')
        group by p.id, w.id, i.id
        order by age_days desc`
    );
    return ok(res, rows);
  })
);

reportsRouter.get(
  "/reorder-suggestions",
  requirePermission("reports:read"),
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `select p.id as product_id, p.sku, p.name as product, p.reorder_point, p.reorder_quantity,
              coalesce(sum(i.available_quantity), 0)::int as available_quantity,
              greatest(p.reorder_quantity, p.reorder_point - coalesce(sum(i.available_quantity), 0))::int as suggested_quantity,
              s.id as supplier_id, s.name as supplier
         from products p
         left join inventory i on i.product_id = p.id
         left join suppliers s on s.id = p.supplier_id
        where p.is_active = true
        group by p.id, s.id
       having coalesce(sum(i.available_quantity), 0) <= p.reorder_point
        order by suggested_quantity desc`
    );
    return ok(res, rows);
  })
);

reportsRouter.get(
  "/export/:type",
  requirePermission("reports:read"),
  asyncHandler(async (req, res) => {
    const type = String(req.params.type);
    const format = String(req.query.format ?? "csv");
    const rows = await exportRows(type, req.query);
    return sendExport(res, rows, `${type}-report`, format);
  })
);

reportsRouter.get(
  "/export",
  requirePermission("reports:read"),
  asyncHandler(async (req, res) => {
    const report = String(req.query.report ?? "stock").toLowerCase();
    const type = report.includes("movement") ? "movements" : report.includes("order") ? "orders" : report.includes("return") ? "returns" : "stock";
    const rows = await exportRows(type, req.query);
    return sendExport(res, rows, `${type}-report`, String(req.query.format ?? "csv"));
  })
);
