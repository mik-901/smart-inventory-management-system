"use client";

import { PackageCheck, Send } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { purchaseOrdersApi } from "@/lib/api/purchaseOrders";
import { formatCurrency } from "@/lib/utils";

export default function PurchaseOrdersPage() {
  const { data: rows, refetch, isLoading } = usePurchaseOrders();

  const updateStatus = async (id: string, status: string) => {
    await purchaseOrdersApi.updateStatus(id, status);
    await refetch();
  };

  return (
    <AppShell title="Purchase Orders" subtitle="Supplier replenishment, receiving, and inventory intake.">
      <Card>
        <CardHeader><CardTitle>Purchase Orders</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow><TableHead>PO</TableHead><TableHead>Supplier</TableHead><TableHead>Warehouse</TableHead><TableHead>Status</TableHead><TableHead>Total</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading purchase orders...</TableCell></TableRow> : null}
              {rows.map((row: any) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.poNumber ?? row.number}</TableCell>
                  <TableCell>{row.supplier}</TableCell>
                  <TableCell>{row.warehouse}</TableCell>
                  <TableCell><Badge>{row.status}</Badge></TableCell>
                  <TableCell>{formatCurrency(row.totalAmount ?? row.amount ?? 0)}</TableCell>
                  <TableCell>{row.orderDate}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => void updateStatus(row.id, "sent")}><Send className="size-4" />Send</Button>
                      <Button size="sm" variant="outline" onClick={() => void updateStatus(row.id, "confirmed")}><PackageCheck className="size-4" />Confirm</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && rows.length === 0 ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No purchase orders</TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
