"use client";

import { Download, FileSpreadsheet, FileText, TableProperties } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { reportRows } from "@/lib/demo-data";
import { reportExportUrl } from "@/lib/api";

export default function ReportsPage() {
  const openExport = (report: string, format: "csv" | "pdf" | "xlsx") => {
    window.open(reportExportUrl(report, format), "_blank", "noopener,noreferrer");
    toast.success(`${format.toUpperCase()} export requested`);
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
                      <Button variant="outline" size="sm" onClick={() => openExport(report.report, "pdf")}>
                        PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openExport(report.report, "xlsx")}>
                        Excel
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openExport(report.report, "csv")}>
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
