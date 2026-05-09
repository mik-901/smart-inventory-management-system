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
import { useApiQuery } from "@/hooks/useApiResource";
import { useProducts } from "@/hooks/useProducts";
import { useWarehouses } from "@/hooks/useWarehouses";
import { apiClient, getApi } from "@/lib/api";
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

export default function OrdersPage() {
  const { data: rows, refetch, isLoading } = useApiQuery(() => getApi<Order[]>("/api/orders"), [], { initialData: [] });
  const { data: products } = useProducts();
  const { data: warehouses } = useWarehouses();
  const [type, setType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [formType, setFormType] = useState<"Purchase" | "Sales" | "Transfer">("Purchase");
  const [formWarehouse, setFormWarehouse] = useState("");
  const [formProduct, setFormProduct] = useState("");
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

  const createOrder = async () => {
    if (!formParty.trim() && formType !== "Transfer") {
      toast.error("Please enter a party name");
      return;
    }
    await apiClient.post("/api/orders", {
      type: formType,
      party: formType === "Transfer" ? "Internal transfer" : formParty,
      warehouse: formWarehouse || warehouses[0]?.name,
      product: formProduct || products[0]?.name,
      quantity: Number(formQty) || 1
    });
    await refetch();
    setFormParty("");
    setFormQty("25");
    toast.success("Order created as draft");
  };

  const advanceStatus = async (order: Order) => {
    const statusLabel = String(order.status).slice(0, 1).toUpperCase() + String(order.status).slice(1);
    const next = nextStatus[statusLabel] ?? statusLabel;
    if (next === statusLabel) return;
    await apiClient.patch(`/api/orders/${order.number}/status`, { status: next, type: order.type });
    await refetch();
    toast.success(`${order.number} -> ${next}`);
  };

  const cancelOrder = async (order: Order) => {
    await apiClient.patch(`/api/orders/${order.number}/status`, { status: "Cancelled", type: order.type });
    await refetch();
    toast.success(`${order.number} cancelled`);
  };

  const deleteOrder = async (order: Order) => {
    await apiClient.delete(`/api/orders/${order.number}`);
    await refetch();
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
                <Select className="w-full" value={formWarehouse || warehouses[0]?.name || ""} onChange={(e) => setFormWarehouse(e.target.value)}>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id}>{warehouse.name}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Product</Label>
                <Select className="w-full" value={formProduct || products[0]?.name || ""} onChange={(e) => setFormProduct(e.target.value)}>
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
            <Button onClick={() => void createOrder()} disabled={!warehouses.length || !products.length}>
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
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Loading orders...</TableCell></TableRow>
              ) : null}
              {filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.number}</TableCell>
                  <TableCell>{order.type}</TableCell>
                  <TableCell>
                    <Badge variant={String(order.status).toLowerCase() === "draft" ? "warning" : String(order.status).toLowerCase() === "cancelled" ? "danger" : "success"}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.party}</TableCell>
                  <TableCell>{order.warehouse}</TableCell>
                  <TableCell>{order.amount ? formatCurrency(order.amount) : "Internal"}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {String(order.status).toLowerCase() !== "received" && String(order.status).toLowerCase() !== "delivered" && String(order.status).toLowerCase() !== "cancelled" && (
                        <Button variant="outline" size="sm" onClick={() => void advanceStatus(order)}>
                          Advance
                        </Button>
                      )}
                      {String(order.status).toLowerCase() === "draft" && (
                        <Button variant="outline" size="sm" onClick={() => void cancelOrder(order)}>Cancel</Button>
                      )}
                      <Button variant="outline" size="icon" onClick={() => void deleteOrder(order)}><Trash2 className="size-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No orders match your search</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
