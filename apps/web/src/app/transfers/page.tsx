"use client";

import { CheckCircle2, Truck } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTransfers, useUpdateTransferStatus } from "@/hooks/useTransfers";

export default function TransfersPage() {
  const { data: rows, refetch, isLoading } = useTransfers();
  const statusMutation = useUpdateTransferStatus(refetch);

  return (
    <AppShell title="Transfers" subtitle="Move inventory between warehouses with dispatch and completion controls.">
      <Card>
        <CardHeader><CardTitle>Transfers</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow><TableHead>Transfer</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading transfers...</TableCell></TableRow> : null}
              {rows.map((row: any) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.transferNumber ?? row.number}</TableCell>
                  <TableCell>{row.fromWarehouse}</TableCell>
                  <TableCell>{row.toWarehouse}</TableCell>
                  <TableCell><Badge>{row.status}</Badge></TableCell>
                  <TableCell>{row.transferDate}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => void statusMutation.mutate(row.id, "in_transit")}><Truck className="size-4" />Dispatch</Button>
                      <Button size="sm" variant="outline" onClick={() => void statusMutation.mutate(row.id, "completed")}><CheckCircle2 className="size-4" />Complete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && rows.length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No transfers</TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
