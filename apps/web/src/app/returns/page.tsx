"use client";

import { RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orders, returns, warehouses } from "@/lib/demo-data";

export default function ReturnsPage() {
  return (
    <AppShell title="Returns" subtitle="Inspect returned goods, restock sellable items, and quarantine damaged stock.">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create Return</CardTitle>
            <CardDescription>Register customer or supplier return against an order.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Order</Label>
                <Select className="w-full">
                  {orders.map((order) => (
                    <option key={order.id}>{order.number}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Warehouse</Label>
                <Select className="w-full">
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id}>{warehouse.name}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input defaultValue="Damaged during transit" />
            </div>
            <Button onClick={() => toast.success("Return created for inspection")}>
              <RotateCcw />
              Create Return
            </Button>
          </CardContent>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="grid size-12 place-items-center rounded-lg bg-primary/12 text-primary">
              <ShieldCheck />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Return Quality Gate</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Returned items can be routed to restock, repair, quarantine, vendor claim, or disposal. Every decision writes
                an audit event and updates inventory history.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Return Orders</CardTitle>
          <CardDescription>Inspection status, reason, linked order, and warehouse location.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>Return</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono text-xs">{record.number}</TableCell>
                  <TableCell>{record.orderNumber}</TableCell>
                  <TableCell>{record.reason}</TableCell>
                  <TableCell>{record.items}</TableCell>
                  <TableCell>{record.warehouse}</TableCell>
                  <TableCell>
                    <Badge variant={record.status === "Restocked" ? "success" : "warning"}>{record.status}</Badge>
                  </TableCell>
                  <TableCell>{record.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
