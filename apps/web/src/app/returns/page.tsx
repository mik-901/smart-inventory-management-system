"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Search, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orders, returns as initialReturns, warehouses } from "@/lib/demo-data";
import type { ReturnRecord } from "@/types";

let returnCounter = initialReturns.length + 1;

export default function ReturnsPage() {
  const [rows, setRows] = useState<ReturnRecord[]>(initialReturns);
  const [searchQuery, setSearchQuery] = useState("");
  const [formOrder, setFormOrder] = useState(orders[0].number);
  const [formWarehouse, setFormWarehouse] = useState(warehouses[0].name);
  const [formReason, setFormReason] = useState("Damaged during transit");
  const [formItems, setFormItems] = useState("1");

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((r) => [r.number, r.orderNumber, r.reason, r.warehouse].join(" ").toLowerCase().includes(q));
  }, [searchQuery, rows]);

  const createReturn = () => {
    if (!formReason.trim()) { toast.error("Please enter a reason"); return; }
    const newReturn: ReturnRecord = {
      id: crypto.randomUUID(),
      number: `RT-2026-${String(90 + returnCounter++).padStart(4, "0")}`,
      orderNumber: formOrder,
      reason: formReason,
      status: "Inspection",
      items: Number(formItems) || 1,
      warehouse: formWarehouse,
      date: new Date().toISOString().split("T")[0]
    };
    setRows((cur) => [newReturn, ...cur]);
    setFormReason("Damaged during transit");
    setFormItems("1");
    toast.success(`${newReturn.number} created for inspection`);
  };

  const updateStatus = (id: string, status: string) => {
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success("Status updated");
  };

  const deleteReturn = (id: string) => {
    const ret = rows.find((r) => r.id === id);
    setRows((cur) => cur.filter((r) => r.id !== id));
    toast.success(`${ret?.number ?? "Return"} deleted`);
  };

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
                <Select className="w-full" value={formOrder} onChange={(e) => setFormOrder(e.target.value)}>
                  {orders.map((order) => (
                    <option key={order.id}>{order.number}</option>
                  ))}
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
                <Label>Reason</Label>
                <Input value={formReason} onChange={(e) => setFormReason(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Items count</Label>
                <Input type="number" value={formItems} onChange={(e) => setFormItems(e.target.value)} min={1} />
              </div>
            </div>
            <Button onClick={createReturn}>
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Return Orders</CardTitle>
              <CardDescription>Inspection status, reason, linked order, and warehouse location.</CardDescription>
            </div>
            <div className="relative sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search returns…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Return</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono text-xs">{record.number}</TableCell>
                  <TableCell>{record.orderNumber}</TableCell>
                  <TableCell>{record.reason}</TableCell>
                  <TableCell>{record.items}</TableCell>
                  <TableCell>{record.warehouse}</TableCell>
                  <TableCell>
                    <Select value={record.status} onChange={(e) => updateStatus(record.id, e.target.value)} className="h-8 text-xs w-32">
                      <option>Inspection</option>
                      <option>Restocked</option>
                      <option>Quarantine</option>
                      <option>Disposed</option>
                    </Select>
                  </TableCell>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button variant="outline" size="icon" onClick={() => deleteReturn(record.id)}><Trash2 className="size-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No returns found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
