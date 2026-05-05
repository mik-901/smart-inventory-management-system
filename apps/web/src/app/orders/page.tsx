"use client";

import { useMemo, useState } from "react";
import { ClipboardPlus, Filter, PackageCheck, Truck } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orders as initialOrders, products, warehouses } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/utils";

export default function OrdersPage() {
  const [type, setType] = useState("All");
  const rows = useMemo(() => initialOrders.filter((order) => type === "All" || order.type === type), [type]);

  return (
    <AppShell title="Orders" subtitle="Purchase, sales, transfer, and dispatch workflows across every warehouse.">
      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create Order</CardTitle>
            <CardDescription>Build purchase, sales, transfer, and dispatch documents.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Order type</Label>
                <Select className="w-full" defaultValue="Purchase">
                  <option>Purchase</option>
                  <option>Sales</option>
                  <option>Transfer</option>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Product</Label>
                <Select className="w-full">
                  {products.map((product) => (
                    <option key={product.id}>{product.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" defaultValue={25} />
              </div>
            </div>
            <Button onClick={() => toast.success("Order draft created")}>
              <ClipboardPlus />
              Create Draft
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <Truck className="size-5 text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Dispatch Queue</p>
            <p className="mt-2 text-2xl font-semibold">27</p>
          </Card>
          <Card className="p-5">
            <PackageCheck className="size-5 text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Received Today</p>
            <p className="mt-2 text-2xl font-semibold">43</p>
          </Card>
          <Card className="p-5">
            <Filter className="size-5 text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Auto PO Suggestions</p>
            <p className="mt-2 text-2xl font-semibold">6</p>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Order Flow</CardTitle>
              <CardDescription>Inward, outward, purchase, transfer, return, and dispatch history.</CardDescription>
            </div>
            <Select value={type} onChange={(event) => setType(event.target.value)}>
              <option>All</option>
              <option>Purchase</option>
              <option>Sales</option>
              <option>Transfer</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.number}</TableCell>
                  <TableCell>{order.type}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === "Draft" ? "warning" : order.status === "Cancelled" ? "danger" : "success"}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.party}</TableCell>
                  <TableCell>{order.warehouse}</TableCell>
                  <TableCell>{order.amount ? formatCurrency(order.amount) : "Internal"}</TableCell>
                  <TableCell>{order.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
