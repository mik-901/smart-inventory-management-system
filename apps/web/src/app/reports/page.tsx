"use client";

import { Download, FileSpreadsheet, FileText, TableProperties } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { reportRows, products, inventory, orders, warehouses } from "@/lib/demo-data";
import { csvDownload } from "@/lib/utils";

/** Build a CSV-friendly row set for each report category */
function getReportData(report: string): Record<string, string | number | null | undefined>[] {
  switch (report) {
    case "Stock valuation":
      return products.map((p) => ({
        SKU: p.sku,
        Name: p.name,
        Category: p.category,
        Stock: p.stock,
        CostPrice: p.costPrice,
        TotalValue: p.stock * p.costPrice
      }));
    case "Movement history":
      return inventory.map((i) => ({
        SKU: i.sku,
        Product: i.product,
        Warehouse: i.warehouse,
        Available: i.available,
        Reserved: i.reserved,
        Damaged: i.damaged,
        LastSync: i.lastSync
      }));
    case "Dead stock report":
      return products
        .filter((p) => p.stock <= p.reorderLevel)
        .map((p) => ({
          SKU: p.sku,
          Name: p.name,
          Stock: p.stock,
          ReorderLevel: p.reorderLevel,
          CostPrice: p.costPrice
        }));
    case "Aging report":
      return products.map((p) => ({
        SKU: p.sku,
        Name: p.name,
        Category: p.category,
        Stock: p.stock,
        Status: p.status
      }));
    case "ABC analysis":
      return products.map((p) => ({
        SKU: p.sku,
        Name: p.name,
        Revenue: p.price * p.stock,
        CostPrice: p.costPrice,
        Class: p.price * p.stock > 500000 ? "A" : p.price * p.stock > 100000 ? "B" : "C"
      }));
    case "Warehouse wise report":
      return warehouses.map((w) => ({
        Code: w.code,
        Name: w.name,
        City: w.city,
        Manager: w.manager,
        Capacity: w.capacityPct
      }));
    case "Supplier wise report":
      return products.map((p) => ({
        Supplier: p.supplier,
        SKU: p.sku,
        Name: p.name,
        Stock: p.stock,
        CostPrice: p.costPrice
      }));
    default:
      return reportRows.map((r) => ({ ...r }));
  }
}

export default function ReportsPage() {
  const downloadCSV = (report: string) => {
    const data = getReportData(report);
    const filename = report.toLowerCase().replace(/\s+/g, "-") + ".csv";
    csvDownload(filename, data);
    toast.success(`${report} CSV downloaded`);
  };

  const downloadAsPDF = (report: string) => {
    // Generate a printable HTML page that the user can "Save as PDF"
    const data = getReportData(report);
    if (data.length === 0) return toast.error("No data for this report");
    const headers = Object.keys(data[0]);
    const rows = data.map((r) => `<tr>${headers.map((h) => `<td style="padding:4px 8px;border:1px solid #ddd">${r[h] ?? ""}</td>`).join("")}</tr>`).join("");
    const html = `<html><head><title>${report}</title><style>body{font-family:system-ui,sans-serif;margin:20px}table{border-collapse:collapse;width:100%}th{background:#f5f5f5;padding:6px 8px;border:1px solid #ddd;text-align:left}</style></head><body><h1>${report}</h1><p>Generated: ${new Date().toLocaleString()}</p><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.print(); }
    toast.success(`${report} PDF opened — use Ctrl+P to save`);
  };

  return (
    <AppShell title="Reports" subtitle="Download stock valuation, movement, dead stock, aging, ABC, supplier, and warehouse reports.">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <FileText className="size-5 text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">PDF Reports</p>
          <p className="mt-2 text-2xl font-semibold">7</p>
        </Card>
        <Card className="p-5">
          <FileSpreadsheet className="size-5 text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Excel Templates</p>
          <p className="mt-2 text-2xl font-semibold">5</p>
        </Card>
        <Card className="p-5">
          <TableProperties className="size-5 text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">CSV Feeds</p>
          <p className="mt-2 text-2xl font-semibold">6</p>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Analytics Exports</CardTitle>
          <CardDescription>Operational reports with downloadable PDF, Excel, and CSV outputs.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Rows</TableHead>
                <TableHead>Freshness</TableHead>
                <TableHead>Formats</TableHead>
                <TableHead className="text-right">Export</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportRows.map((report) => (
                <TableRow key={report.report}>
                  <TableCell className="font-medium">{report.report}</TableCell>
                  <TableCell>{report.owner}</TableCell>
                  <TableCell>{report.rows.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge variant={report.freshness === "Live" ? "success" : "secondary"}>{report.freshness}</Badge>
                  </TableCell>
                  <TableCell>{report.format}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => downloadAsPDF(report.report)}>
                        PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadCSV(report.report)}>
                        Excel
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadCSV(report.report)}>
                        <Download />
                        CSV
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
