"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Check, Edit, Search, Trash2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { ProductForm } from "@/components/products/product-form";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { products as initialProducts } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

const statusVariant = {
  Healthy: "success",
  "Low Stock": "warning",
  Overstock: "default",
  Expiring: "danger"
} as const;

export default function ProductsPage() {
  const [rows, setRows] = useState<Product[]>(initialProducts);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Product>>({});

  const filtered = useMemo(() => {
    return rows.filter((product) => {
      const matchesQuery = [product.name, product.sku, product.brand, product.supplier, product.barcode]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesCategory = category === "All" || product.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [category, query, rows]);

  const startEdit = (product: Product) => {
    setEditId(product.id);
    setEditDraft({ name: product.name, price: product.price, costPrice: product.costPrice, reorderLevel: product.reorderLevel, supplier: product.supplier, brand: product.brand, category: product.category });
  };

  const saveEdit = (id: string) => {
    setRows((current) => current.map((p) => (p.id === id ? { ...p, ...editDraft } : p)));
    setEditId(null);
    setEditDraft({});
    toast.success("Product updated");
  };

  const cancelEdit = () => { setEditId(null); setEditDraft({}); };

  const deleteProduct = (id: string, sku: string) => {
    setRows((current) => current.filter((item) => item.id !== id));
    toast.success(`${sku} deleted`);
  };

  const filtered = useMemo(() => {
    return rows.filter((product) => {
      const matchesQuery = [product.name, product.sku, product.brand, product.supplier]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesCategory = category === "All" || product.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [category, query, rows]);

  return (
    <AppShell title="Products" subtitle="Create, edit, scan, and govern SKUs with supplier, batch, and variant metadata.">
      <div className="grid gap-6">
        <ProductForm
          onCreate={(draft) => {
            const product: Product = {
              id: crypto.randomUUID(),
              name: draft.name,
              sku: draft.sku,
              category: draft.category,
              brand: draft.brand,
              price: Number(draft.price || 0),
              costPrice: Number(draft.costPrice || 0),
              barcode: draft.barcode,
              variants: draft.variants.split(",").map((item) => item.trim()).filter(Boolean),
              batchNumber: draft.batchNumber,
              expiryDate: draft.expiryDate,
              reorderLevel: Number(draft.reorderLevel || 0),
              supplier: draft.supplier,
              imageUrl: draft.imageUrl || "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800",
              stock: 0,
              status: "Low Stock"
            };
            setRows((current) => [product, ...current]);
            toast.success(`${product.sku} created`);
          }}
        />

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Product Catalog</CardTitle>
                <CardDescription>Fast search, filters, QR generation, and inventory-aware SKU status.</CardDescription>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative sm:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" />
                </div>
                <Select value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option>All</option>
                  <option>Electronics</option>
                  <option>Hardware</option>
                  <option>IoT</option>
                  <option>Packaging</option>
                  <option>Consumables</option>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Batch / Expiry</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>QR</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={44}
                          height={44}
                          className="size-11 rounded-md object-cover"
                        />
                        <div>
                          {editId === product.id ? (
                            <Input className="h-7 text-sm" value={editDraft.name ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))} />
                          ) : (
                            <p className="font-medium">{product.name}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{product.brand} · {product.variants.join(", ")}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                    <TableCell>
                      {editId === product.id ? (
                        <Select className="h-7 text-xs" value={editDraft.category ?? product.category} onChange={(e) => setEditDraft((d) => ({ ...d, category: e.target.value }))}>
                          <option>Electronics</option><option>Hardware</option><option>IoT</option><option>Packaging</option><option>Consumables</option>
                        </Select>
                      ) : product.category}
                    </TableCell>
                    <TableCell>
                      {editId === product.id ? (
                        <div className="space-y-1">
                          <Input className="h-7 w-24 text-xs" type="number" value={editDraft.price ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, price: Number(e.target.value) }))} />
                          <Input className="h-7 w-24 text-xs" type="number" value={editDraft.costPrice ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, costPrice: Number(e.target.value) }))} placeholder="Cost" />
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">{formatCurrency(product.price)}</p>
                          <p className="text-xs text-muted-foreground">Cost {formatCurrency(product.costPrice)}</p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={statusVariant[product.status]}>{product.status}</Badge>
                        <p className="text-xs text-muted-foreground">{product.stock} units · reorder {editId === product.id ? (
                          <Input className="ml-1 inline-block h-6 w-14 text-xs" type="number" value={editDraft.reorderLevel ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, reorderLevel: Number(e.target.value) }))} />
                        ) : product.reorderLevel}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{product.batchNumber || "Unbatched"}</p>
                      <p className="text-xs text-muted-foreground">{product.expiryDate || "No expiry"}</p>
                    </TableCell>
                    <TableCell>
                      {editId === product.id ? (
                        <Input className="h-7 w-28 text-xs" value={editDraft.supplier ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, supplier: e.target.value }))} />
                      ) : product.supplier}
                    </TableCell>
                    <TableCell>
                      <div className="rounded-md bg-white p-1">
                        <QRCodeSVG value={product.barcode || product.sku} size={48} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {editId === product.id ? (
                          <>
                            <Button variant="default" size="icon" onClick={() => saveEdit(product.id)}><Check className="size-4" /></Button>
                            <Button variant="outline" size="icon" onClick={cancelEdit}><X className="size-4" /></Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="icon" onClick={() => startEdit(product)}><Edit className="size-4" /></Button>
                            <Button variant="outline" size="icon" onClick={() => deleteProduct(product.id, product.sku)}><Trash2 className="size-4" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
