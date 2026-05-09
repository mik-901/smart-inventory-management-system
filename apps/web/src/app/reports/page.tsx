"use client";

import { Download, FileSpreadsheet, FileText, TableProperties } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReports } from "@/hooks/useReports";
import { reportsApi } from "@/lib/api/reports";

export default function ReportsPage() {
  const { data: reportRows, isLoading } = useReports();

  const exportReport = (report: string, format: "csv" | "xlsx") => {
    const lower = report.toLowerCase();
    const type = lower.includes("movement") ? "movements" : lower.includes("order") ? "orders" : lower.includes("return") ? "returns" : "stock";
    window.location.href = reportsApi.exportUrl(type, format);
    toast.success(`${report} export started`);
  };

  const downloadAsPDF = (report: string) => {
    toast.info(`${report} is available as CSV or Excel from the API export endpoint.`);
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
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading reports...</TableCell></TableRow>
              ) : null}
              {reportRows.map((report: any) => (
                <TableRow key={report.report}>
                  <TableCell className="font-medium">{report.report}</TableCell>
                  <TableCell>{report.owner}</TableCell>
                  <TableCell>{report.rows?.toLocaleString?.("en-IN") ?? "Live"}</TableCell>
                  <TableCell>
                    <Badge variant={report.freshness === "Live" ? "success" : "secondary"}>{report.freshness}</Badge>
                  </TableCell>
                  <TableCell>{report.format}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => downloadAsPDF(report.report)}>
                        PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => exportReport(report.report, "xlsx")}>
                        Excel
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => exportReport(report.report, "csv")}>
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
