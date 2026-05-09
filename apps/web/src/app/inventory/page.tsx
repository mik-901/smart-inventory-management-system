"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowRightLeft, FileSpreadsheet, Minus, Plus, RefreshCcw, Search, ShieldAlert, Upload } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdjustInventory, useInventory } from "@/hooks/useInventory";
import { useWarehouses } from "@/hooks/useWarehouses";
import { env } from "@/lib/env";

type ActionMode = "add" | "remove" | "transfer" | "damage";

export default function InventoryPage() {
  const { data: rows, refetch, isLoading } = useInventory();
  const { data: warehouses } = useWarehouses();
  const adjustInventory = useAdjustInventory(refetch);
  const [mode, setMode] = useState<ActionMode>("add");
  const [sku, setSku] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => rows.find((row) => row.sku === (sku || rows[0]?.sku)) ?? rows[0], [rows, sku]);
  const totalAvailable = rows.reduce((sum, row) => sum + row.available, 0);
  const totalReserved = rows.reduce((sum, row) => sum + row.reserved, 0);
  const totalDamaged = rows.reduce((sum, row) => sum + (row.damaged ?? 0), 0);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((r) => [r.product, r.sku, r.warehouse].join(" ").toLowerCase().includes(q));
  }, [searchQuery, rows]);

  const applyAdjustment = async () => {
    const amount = Number(quantity || 0);
    if (!amount || amount < 1) {
      toast.error("Enter a valid quantity");
      return;
    }

    await adjustInventory.mutate({
      sku: sku || selected?.sku,
      warehouse: warehouse || selected?.warehouse,
      quantity: amount,
      type: mode === "damage" ? "DAMAGED" : mode === "add" ? "ADD" : "REMOVE",
      reason: `${mode} from inventory screen`
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("accessToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const res = await fetch(`${apiUrl}/inventory/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      if (data.data?.errors?.length > 0) {
        toast.warning(`Imported ${data.data.imported} rows, but had ${data.data.errors.length} errors.`);
        console.error("Import Errors:", data.data.errors);
      } else {
        toast.success(`Successfully imported ${data.data?.imported || 0} inventory rows`);
      }

      void refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to import CSV");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <AppShell title="Inventory" subtitle="Realtime quantity updates, multi-warehouse stock, transfers, and damaged stock control.">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Available Stock</p>
            <p className="mt-2 text-2xl font-semibold">{totalAvailable.toLocaleString("en-IN")}</p>
            <Progress className="mt-4" value={78} />
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Reserved</p>
            <p className="mt-2 text-2xl font-semibold">{totalReserved.toLocaleString("en-IN")}</p>
            <Progress className="mt-4" value={34} />
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Damaged</p>
            <p className="mt-2 text-2xl font-semibold">{totalDamaged.toLocaleString("en-IN")}</p>
            <Progress className="mt-4" value={12} />
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stock Operation</CardTitle>
            <CardDescription>Add, remove, transfer, or adjust damaged stock with an audit trail event.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {[
                { key: "add", label: "Add stock", icon: Plus },
                { key: "remove", label: "Remove", icon: Minus },
                { key: "transfer", label: "Transfer", icon: ArrowRightLeft },
                { key: "damage", label: "Damaged", icon: ShieldAlert }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.key}
                    variant={mode === item.key ? "default" : "outline"}
                    onClick={() => setMode(item.key as ActionMode)}
                  >
                    <Icon />
                    {item.label}
                  </Button>
                );
              })}
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="sku">Product / SKU</Label>
                <Select id="sku" value={sku || rows[0]?.sku || ""} onChange={(event) => setSku(event.target.value)} className="w-full">
                  {rows.map((row) => (
                    <option key={row.id} value={row.sku}>
                      {row.product} · {row.sku}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse">Warehouse</Label>
                <Select id="warehouse" value={warehouse || selected?.warehouse || ""} onChange={(event) => setWarehouse(event.target.value)} className="w-full">
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id}>{warehouse.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              </div>
            </div>
            {mode === "transfer" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>From warehouse</Label>
                  <Select className="w-full" defaultValue="Mumbai Central Hub">
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id}>{warehouse.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To warehouse</Label>
                  <Select className="w-full" defaultValue="Delhi North DC">
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id}>{warehouse.name}</option>
                    ))}
                  </Select>
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => void applyAdjustment()} disabled={!selected}>
                <RefreshCcw className="mr-2 size-4" />
                Sync Stock
              </Button>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => void handleFileUpload(e)}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                {isUploading ? <RefreshCcw className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
                Import CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Live Warehouse Stock</CardTitle>
              <CardDescription>Stock quantities by SKU and warehouse with reorder health.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search product, SKU, warehouse..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Damaged</TableHead>
                <TableHead>Reorder</TableHead>
                <TableHead>Sync</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading inventory...</TableCell></TableRow>
              ) : null}
              {filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-medium">{row.product}</p>
                    <p className="font-mono text-xs text-muted-foreground">{row.sku}</p>
                  </TableCell>
                  <TableCell>{row.warehouse}</TableCell>
                  <TableCell className="font-semibold">{row.available}</TableCell>
                  <TableCell>{row.reserved}</TableCell>
                  <TableCell>{row.damaged ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={row.available <= row.reorderLevel ? "warning" : "success"}>
                      {row.available <= row.reorderLevel ? "Reorder" : "Healthy"}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.lastSync}</TableCell>
                </TableRow>
              ))}
              {!isLoading && filteredRows.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No inventory items match your search.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
