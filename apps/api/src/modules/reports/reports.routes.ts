import { Router } from "express";
import { stringify } from "csv-stringify/sync";
import ExcelJS from "exceljs";

import { prisma } from "../../db/prisma.js";
import { requirePermission } from "../../middleware/rbac.js";
import { asyncHandler, ok } from "../../utils/http.js";

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
  return prisma.$queryRawUnsafe<any[]>(
    `SELECT p.sku, p.name as product, w.name as warehouse,
            COALESCE(SUM(i.quantity), 0) as quantity,
            p.cost_price as costPrice,
            COALESCE(SUM(i.quantity * p.cost_price), 0) as value
     FROM inventory i
     JOIN products p ON p.id = i.product_id
     JOIN warehouses w ON w.id = i.warehouse_id
     GROUP BY p.id, w.id
     ORDER BY value DESC`
  );
}

async function movementRows(filters: { from?: unknown; to?: unknown; productId?: unknown } = {}) {
  let where = "";
  const conditions: string[] = [];
  if (filters.from) conditions.push(`sm.created_at >= '${String(filters.from)}'`);
  if (filters.to) conditions.push(`sm.created_at <= '${String(filters.to)}'`);
  if (filters.productId) conditions.push(`sm.product_id = '${String(filters.productId)}'`);
  if (conditions.length) where = `WHERE ${conditions.join(" AND ")}`;

  return prisma.$queryRawUnsafe<any[]>(
    `SELECT sm.created_at, sm.movement_type, sm.quantity, sm.reference_type, sm.reference_id,
            p.sku, p.name as product, w.name as warehouse, u.name as created_by
     FROM stock_movements sm
     JOIN products p ON p.id = sm.product_id
     JOIN warehouses w ON w.id = sm.warehouse_id
     LEFT JOIN users u ON u.id = sm.created_by
     ${where}
     ORDER BY sm.created_at DESC`
  );
}

async function exportRows(type: string, reqQuery: Record<string, unknown>) {
  if (type === "stock") return stockValuationRows();
  if (type === "movements") return movementRows({ from: reqQuery.from, to: reqQuery.to, productId: reqQuery.productId });
  if (type === "orders") {
    return prisma.$queryRawUnsafe<any[]>(
      `SELECT 'purchase' as order_type, po_number as number, status, order_date, total_amount FROM purchase_orders
       UNION ALL
       SELECT 'sales' as order_type, so_number as number, status, order_date, total_amount FROM sales_orders
       ORDER BY order_date DESC`
    );
  }
  if (type === "returns") {
    return prisma.$queryRawUnsafe<any[]>(
      "SELECT return_number, reference_type, reason, status, total_items, created_at FROM returns ORDER BY created_at DESC"
    );
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

reportsRouter.get("/", requirePermission("reports:read"), (_req, res) => ok(res, reportDefinitions));

reportsRouter.get("/stock-valuation", requirePermission("reports:read"), asyncHandler(async (_req, res) => {
  const rows = await stockValuationRows();
  return ok(res, rows.map((r: any) => ({ ...r, quantity: Number(r.quantity), costPrice: Number(r.costPrice), value: Number(r.value) })));
}));

reportsRouter.get("/movement-history", requirePermission("reports:read"), asyncHandler(async (req, res) => {
  return ok(res, await movementRows({ from: req.query.from, to: req.query.to, productId: req.query.productId }));
}));

reportsRouter.get("/abc-analysis", requirePermission("reports:read"), asyncHandler(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `WITH revenue AS (
       SELECT p.id, p.sku, p.name, COALESCE(SUM(soi.unit_price * soi.quantity), 0) as revenue
       FROM products p
       LEFT JOIN sales_order_items soi ON soi.product_id = p.id
       LEFT JOIN sales_orders so ON so.id = soi.so_id AND so.status IN ('confirmed', 'shipped', 'delivered')
       GROUP BY p.id
     )
     SELECT sku, name, revenue FROM revenue ORDER BY revenue DESC`
  );
  const grandTotal = rows.reduce((s: number, r: any) => s + Number(r.revenue), 0);
  let cumulative = 0;
  return ok(res, rows.map((r: any) => {
    cumulative += Number(r.revenue);
    const cls = grandTotal === 0 ? "C" : cumulative / grandTotal <= 0.8 ? "A" : cumulative / grandTotal <= 0.95 ? "B" : "C";
    return { sku: r.sku, name: r.name, revenue: Number(r.revenue), grandTotal, class: cls };
  }));
}));

reportsRouter.get("/dead-stock", requirePermission("reports:read"), asyncHandler(async (req, res) => {
  const days = Math.max(1, Number(req.query.days ?? 90));
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT p.sku, p.name as product, COALESCE(SUM(i.quantity), 0) as quantity,
            MAX(sm.created_at) as last_movement_at
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.id
     LEFT JOIN stock_movements sm ON sm.product_id = p.id
     WHERE p.is_active = 1
     GROUP BY p.id
     HAVING MAX(sm.created_at) IS NULL OR MAX(sm.created_at) < datetime('now', '-${days} days')
     ORDER BY quantity DESC`
  );
  return ok(res, rows);
}));

reportsRouter.get("/aging", requirePermission("reports:read"), asyncHandler(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT p.sku, p.name as product, w.name as warehouse, i.batch_number, i.quantity,
            MIN(sm.created_at) as first_received_at,
            CAST(julianday('now') - julianday(COALESCE(MIN(sm.created_at), i.updated_at)) AS INTEGER) as age_days
     FROM inventory i
     JOIN products p ON p.id = i.product_id
     JOIN warehouses w ON w.id = i.warehouse_id
     LEFT JOIN stock_movements sm ON sm.product_id = i.product_id
       AND sm.warehouse_id = i.warehouse_id
       AND sm.movement_type IN ('purchase', 'transfer_in', 'return')
     GROUP BY p.id, w.id, i.id
     ORDER BY age_days DESC`
  );
  return ok(res, rows);
}));

reportsRouter.get("/reorder-suggestions", requirePermission("reports:read"), asyncHandler(async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT p.id as product_id, p.sku, p.name as product, p.reorder_point, p.reorder_quantity,
            COALESCE(SUM(i.quantity - i.reserved_quantity), 0) as available_quantity,
            MAX(p.reorder_quantity, p.reorder_point - COALESCE(SUM(i.quantity - i.reserved_quantity), 0)) as suggested_quantity,
            s.id as supplier_id, s.name as supplier
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.id
     LEFT JOIN suppliers s ON s.id = p.supplier_id
     WHERE p.is_active = 1
     GROUP BY p.id, s.id
     HAVING COALESCE(SUM(i.quantity - i.reserved_quantity), 0) <= p.reorder_point
     ORDER BY suggested_quantity DESC`
  );
  return ok(res, rows);
}));

reportsRouter.get("/export/:type", requirePermission("reports:read"), asyncHandler(async (req, res) => {
  const type = String(req.params.type);
  const format = String(req.query.format ?? "csv");
  const rows = await exportRows(type, req.query);
  return sendExport(res, rows, `${type}-report`, format);
}));

reportsRouter.get("/export", requirePermission("reports:read"), asyncHandler(async (req, res) => {
  const report = String(req.query.report ?? "stock").toLowerCase();
  const type = report.includes("movement") ? "movements" : report.includes("order") ? "orders" : report.includes("return") ? "returns" : "stock";
  const rows = await exportRows(type, req.query);
  return sendExport(res, rows, `${type}-report`, String(req.query.format ?? "csv"));
}));
