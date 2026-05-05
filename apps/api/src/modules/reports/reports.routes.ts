import { Router } from "express";
import { stringify } from "csv-stringify/sync";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

import { demoStore } from "../../data/demo-store.js";
import { requirePermission } from "../../middleware/rbac.js";

export const reportsRouter = Router();

const reportDefinitions = [
  { report: "Stock valuation", owner: "Finance", rows: 1248, freshness: "Live", format: "PDF / Excel / CSV" },
  { report: "Movement history", owner: "Operations", rows: 8920, freshness: "5 min", format: "Excel / CSV" },
  { report: "Dead stock report", owner: "Procurement", rows: 84, freshness: "Daily", format: "PDF / CSV" },
  { report: "Aging report", owner: "Compliance", rows: 302, freshness: "Hourly", format: "PDF / Excel" },
  { report: "ABC analysis", owner: "Planning", rows: 512, freshness: "Daily", format: "Excel" },
  { report: "Warehouse wise report", owner: "Regional Ops", rows: 318, freshness: "Live", format: "PDF / Excel / CSV" },
  { report: "Supplier wise report", owner: "Procurement", rows: 126, freshness: "Daily", format: "Excel / CSV" }
];

function rowsForReport(report: string) {
  if (report.toLowerCase().includes("warehouse")) return demoStore.warehouses;
  if (report.toLowerCase().includes("movement")) return demoStore.activities;
  if (report.toLowerCase().includes("supplier")) return demoStore.products.map((product) => ({ sku: product.sku, product: product.name, supplier: product.supplier }));
  return demoStore.products.map((product) => ({
    sku: product.sku,
    product: product.name,
    category: product.category,
    stock: product.stock,
    value: product.stock * product.costPrice,
    status: product.status
  }));
}

reportsRouter.get("/", requirePermission("reports:read"), (_req, res) => {
  res.json({ data: reportDefinitions });
});

reportsRouter.get("/export", requirePermission("reports:read"), async (req, res) => {
  const report = String(req.query.report ?? "Stock valuation");
  const format = String(req.query.format ?? "csv");
  const rows = rowsForReport(report);
  const filename = report.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  if (format === "csv") {
    const csv = stringify(rows, { header: true });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
    return res.send(csv);
  }

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(report);
    const columns = Object.keys(rows[0] ?? { report: "No data" });
    sheet.columns = columns.map((key) => ({ header: key, key, width: 24 }));
    rows.forEach((row) => sheet.addRow(row));
    sheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);
    return res.send(Buffer.from(buffer));
  }

  const document = new PDFDocument({ margin: 40 });
  const chunks: Buffer[] = [];
  document.on("data", (chunk) => chunks.push(chunk));
  document.on("end", () => {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);
    res.send(Buffer.concat(chunks));
  });
  document.fontSize(18).text(report, { underline: true });
  document.moveDown();
  rows.slice(0, 20).forEach((row) => {
    document.fontSize(10).text(JSON.stringify(row));
  });
  document.end();
});
