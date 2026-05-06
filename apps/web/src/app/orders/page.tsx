"use client";

import { useMemo, useState } from "react";
import { ClipboardPlus, Filter, PackageCheck, Search, Trash2, Truck } from "lucide-react";
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
import type { Order } from "@/types";

const nextStatus: Record<string, string> = {
  Draft: "Approved",
  Approved: "Dispatched",
  Dispatched: "Received",
  Received: "Received",
  Returned: "Returned",
  Cancelled: "Cancelled"
};

let orderCounter = initialOrders.length + 1;

export default function OrdersPage() {
  const [rows, setRows] = useState<Order[]>(initialOrders);
  const [type, setType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [formType, setFormType] = useState<"Purchase" | "Sales" | "Transfer">("Purchase");
  const [formWarehouse, setFormWarehouse] = useState(warehouses[0].name);
  const [formProduct, setFormProduct] = useState(products[0].name);
  const [formQty, setFormQty] = useState("25");
  const [formParty, setFormParty] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((order) => {
      const matchesType = type === "All" || order.type === type;
      const matchesSearch = !searchQuery.trim() || [order.number, order.party, order.warehouse].join(" ").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [type, searchQuery, rows]);

  const dispatchQueue = rows.filter((o) => o.status === "Approved").length;
  const receivedToday = rows.filter((o) => o.status === "Received").length;
  const drafts = rows.filter((o) => o.status === "Draft").length;

  const createOrder = () => {
    if (!formParty.trim() && formType !== "Transfer") {
      toast.error("Please enter a party name");
      return;
    }
    const prefix = formType === "Purchase" ? "PO" : formType === "Sales" ? "SO" : "TO";
    const newOrder: Order = {
      id: crypto.randomUUID(),
      number: `${prefix}-2026-${String(1000 + orderCounter++).slice(0)}`,
      type: formType,
      status: "Draft",
      party: formType === "Transfer" ? "Internal transfer" : formParty,
      warehouse: formWarehouse,
      amount: Number(formQty) * (products.find((p) => p.name === formProduct)?.price ?? 0),
      date: new Date().toISOString().split("T")[0]
    };
    setRows((cur) => [newOrder, ...cur]);
    setFormParty("");
    setFormQty("25");
    toast.success(`${newOrder.number} created as Draft`);
  };

  const advanceStatus = (id: string) => {
    setRows((cur) =>
      cur.map((o) => {
        if (o.id !== id) return o;
        const next = nextStatus[o.status] ?? o.status;
        if (next === o.status) return o;
        toast.success(`${o.number} → ${next}`);
        return { ...o, status: next as Order["status"] };
      })
    );
  };

  const cancelOrder = (id: string) => {
    setRows((cur) =>
      cur.map((o) => {
        if (o.id !== id || o.status === "Cancelled") return o;
        toast.success(`${o.number} cancelled`);
        return { ...o, status: "Cancelled" as Order["status"] };
      })
    );
  };

  const deleteOrder = (id: string) => {
    const order = rows.find((o) => o.id === id);
    setRows((cur) => cur.filter((o) => o.id !== id));
    toast.success(`${order?.number ?? "Order"} deleted`);
  };

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
                <Select className="w-full" value={formType} onChange={(e) => setFormType(e.target.value as any)}>
                  <option>Purchase</option>
                  <option>Sales</option>
                  <option>Transfer</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Warehouse</Label>
                <Select className="w-full" value={formWarehouse} onChange={(e) => setFormWarehouse(e.target.value)}>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id}>{warehouse.name}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Product</Label>
                <Select className="w-full" value={formProduct} onChange={(e) => setFormProduct(e.target.value)}>
                  {products.map((product) => (
                    <option key={product.id}>{product.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" value={formQty} onChange={(e) => setFormQty(e.target.value)} />
              </div>
            </div>
            {formType !== "Transfer" && (
              <div className="space-y-2">
                <Label>{formType === "Purchase" ? "Supplier" : "Customer"}</Label>
                <Input placeholder={formType === "Purchase" ? "Northstar Components" : "BrightMart Retail"} value={formParty} onChange={(e) => setFormParty(e.target.value)} />
              </div>
            )}
            <Button onClick={createOrder}>
              <ClipboardPlus />
              Create Draft
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <Truck className="size-5 text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Dispatch Queue</p>
            <p className="mt-2 text-2xl font-semibold">{dispatchQueue}</p>
          </Card>
          <Card className="p-5">
            <PackageCheck className="size-5 text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Received</p>
            <p className="mt-2 text-2xl font-semibold">{receivedToday}</p>
          </Card>
          <Card className="p-5">
            <Filter className="size-5 text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Drafts Pending</p>
            <p className="mt-2 text-2xl font-semibold">{drafts}</p>
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
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search orders…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select value={type} onChange={(event) => setType(event.target.value)}>
                <option>All</option>
                <option>Purchase</option>
                <option>Sales</option>
                <option>Transfer</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
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
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {order.status !== "Received" && order.status !== "Cancelled" && (
                        <Button variant="outline" size="sm" onClick={() => advanceStatus(order.id)}>
                          → {nextStatus[order.status]}
                        </Button>
                      )}
                      {order.status === "Draft" && (
                        <Button variant="outline" size="sm" onClick={() => cancelOrder(order.id)}>Cancel</Button>
                      )}
                      <Button variant="outline" size="icon" onClick={() => deleteOrder(order.id)}><Trash2 className="size-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No orders match your search</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
