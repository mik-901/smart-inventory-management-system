"use client";

import { CheckCircle2, PackageCheck, Truck } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSalesOrders, useUpdateSalesOrderStatus } from "@/hooks/useSalesOrders";
import { formatCurrency } from "@/lib/utils";

export default function SalesOrdersPage() {
  const { data: rows, refetch, isLoading } = useSalesOrders();
  const statusMutation = useUpdateSalesOrderStatus(refetch);

  return (
    <AppShell title="Sales Orders" subtitle="Customer orders, stock reservations, shipment, and delivery workflow.">
      <Card>
        <CardHeader><CardTitle>Sales Orders</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow><TableHead>SO</TableHead><TableHead>Customer</TableHead><TableHead>Warehouse</TableHead><TableHead>Status</TableHead><TableHead>Total</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading sales orders...</TableCell></TableRow> : null}
              {rows.map((row: any) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.soNumber ?? row.number}</TableCell>
                  <TableCell>{row.customerName}</TableCell>
                  <TableCell>{row.warehouse}</TableCell>
                  <TableCell><Badge>{row.status}</Badge></TableCell>
                  <TableCell>{formatCurrency(row.totalAmount ?? row.amount ?? 0)}</TableCell>
                  <TableCell>{row.orderDate}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => void statusMutation.mutate(row.id, "confirmed")}><CheckCircle2 className="size-4" />Confirm</Button>
                      <Button size="sm" variant="outline" onClick={() => void statusMutation.mutate(row.id, "shipped")}><Truck className="size-4" />Ship</Button>
                      <Button size="sm" variant="outline" onClick={() => void statusMutation.mutate(row.id, "delivered")}><PackageCheck className="size-4" />Deliver</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && rows.length === 0 ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No sales orders</TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
