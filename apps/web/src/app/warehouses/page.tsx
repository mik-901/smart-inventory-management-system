"use client";

import { useMemo, useState } from "react";
import { Building2, MapPin, PackageCheck, Plus, Search, Trash2, Truck, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { warehouses as initialWarehouses } from "@/lib/demo-data";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Warehouse } from "@/types";

export default function WarehousesPage() {
  const [rows, setRows] = useState<Warehouse[]>(initialWarehouses);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formManager, setFormManager] = useState("");
  const [formCapacity, setFormCapacity] = useState("5000");

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((w) => [w.name, w.code, w.city, w.manager].join(" ").toLowerCase().includes(q));
  }, [searchQuery, rows]);

  const addWarehouse = () => {
    if (!formName.trim() || !formCode.trim() || !formCity.trim()) {
      toast.error("Please fill in name, code, and city");
      return;
    }
    const newWarehouse: Warehouse = {
      id: crypto.randomUUID(),
      name: formName,
      code: formCode.toUpperCase(),
      city: formCity,
      manager: formManager || "Unassigned",
      capacity: Number(formCapacity) || 5000,
      utilization: 0,
      stockValue: 0,
      ordersToday: 0
    };
    setRows((cur) => [...cur, newWarehouse]);
    setFormName(""); setFormCode(""); setFormCity(""); setFormManager(""); setFormCapacity("5000");
    setShowForm(false);
    toast.success(`${newWarehouse.name} added`);
  };

  const deleteWarehouse = (id: string) => {
    const w = rows.find((r) => r.id === id);
    setRows((cur) => cur.filter((r) => r.id !== id));
    toast.success(`${w?.name ?? "Warehouse"} removed`);
  };

  return (
    <AppShell title="Warehouses" subtitle="Regional stock visibility, capacity utilization, and fulfillment performance.">
      <div className="grid gap-4 md:grid-cols-3">
        {filtered.slice(0, 6).map((warehouse) => (
          <Card key={warehouse.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge>{warehouse.code}</Badge>
                <h2 className="mt-4 text-lg font-semibold">{warehouse.name}</h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  {warehouse.city}
                </p>
              </div>
              <div className="grid size-11 place-items-center rounded-lg bg-primary/12 text-primary">
                <Building2 className="size-5" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border bg-background/50 p-3">
                <p className="text-muted-foreground">Capacity</p>
                <p className="mt-1 font-semibold">{formatNumber(warehouse.capacity)}</p>
              </div>
              <div className="rounded-md border bg-background/50 p-3">
                <p className="text-muted-foreground">Orders</p>
                <p className="mt-1 font-semibold">{warehouse.ordersToday}</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Utilization</span>
                <span className="font-medium">{warehouse.utilization}%</span>
              </div>
              <Progress value={warehouse.utilization} />
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Warehouse Wise Report</CardTitle>
              <CardDescription>Capacity, manager ownership, stock value, and live order load.</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search warehouses…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Button onClick={() => setShowForm((v) => !v)}>
                {showForm ? <X className="size-4" /> : <PackageCheck className="size-4" />}
                {showForm ? "Cancel" : "Add Warehouse"}
              </Button>
            </div>
          </div>
        </CardHeader>
        {showForm && (
          <CardContent className="border-b pb-6">
            <div className="grid gap-4 sm:grid-cols-5">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input placeholder="Pune East Hub" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Code</Label>
                <Input placeholder="PUN-EST" value={formCode} onChange={(e) => setFormCode(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>City</Label>
                <Input placeholder="Pune" value={formCity} onChange={(e) => setFormCity(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Manager</Label>
                <Input placeholder="Name" value={formManager} onChange={(e) => setFormManager(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Capacity</Label>
                <Input type="number" value={formCapacity} onChange={(e) => setFormCapacity(e.target.value)} />
              </div>
            </div>
            <Button className="mt-4" onClick={addWarehouse}><Plus className="size-4" /> Add</Button>
          </CardContent>
        )}
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Stock Value</TableHead>
                <TableHead>Orders Today</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Dispatch</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell>
                    <p className="font-medium">{warehouse.name}</p>
                    <p className="text-xs text-muted-foreground">{warehouse.code}</p>
                  </TableCell>
                  <TableCell>{warehouse.manager}</TableCell>
                  <TableCell>{formatCurrency(warehouse.stockValue)}</TableCell>
                  <TableCell>{warehouse.ordersToday}</TableCell>
                  <TableCell>
                    <div className="flex min-w-40 items-center gap-3">
                      <Progress value={warehouse.utilization} />
                      <span className="text-xs">{warehouse.utilization}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">
                      <Truck className="mr-1 size-3" />
                      On track
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button variant="outline" size="icon" onClick={() => deleteWarehouse(warehouse.id)}><Trash2 className="size-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No warehouses found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
