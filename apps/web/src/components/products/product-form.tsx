"use client";

import { FormEvent, useMemo, useState } from "react";
import { ImagePlus, Plus } from "lucide-react";

import { BarcodeScanner } from "@/components/scanner/barcode-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { generateSku } from "@/lib/utils";

type ProductDraft = {
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: string;
  costPrice: string;
  barcode: string;
  variants: string;
  batchNumber: string;
  expiryDate: string;
  reorderLevel: string;
  supplier: string;
  imageUrl: string;
};

const initialDraft: ProductDraft = {
  name: "",
  sku: "",
  category: "Electronics",
  brand: "",
  price: "",
  costPrice: "",
  barcode: "",
  variants: "",
  batchNumber: "",
  expiryDate: "",
  reorderLevel: "25",
  supplier: "",
  imageUrl: ""
};

export function ProductForm({ onCreate }: { onCreate: (draft: ProductDraft) => void }) {
  const [draft, setDraft] = useState(initialDraft);
  const generatedSku = useMemo(() => generateSku(draft.name || "Product", Date.now() % 9999), [draft.name]);

  const update = (key: keyof ProductDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCreate({ ...draft, sku: draft.sku || generatedSku });
    setDraft(initialDraft);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Product / SKU</CardTitle>
        <CardDescription>Create sellable SKUs with batch, variants, supplier, barcode, and reorder settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Product name</Label>
              <Input id="name" required value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder="NovaScan Wireless Scanner" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={draft.sku || generatedSku} onChange={(event) => update("sku", event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select id="category" value={draft.category} onChange={(event) => update("category", event.target.value)}>
                <option>Electronics</option>
                <option>Hardware</option>
                <option>IoT</option>
                <option>Packaging</option>
                <option>Consumables</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" value={draft.brand} onChange={(event) => update("brand", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" value={draft.price} onChange={(event) => update("price", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost price</Label>
              <Input id="cost" type="number" value={draft.costPrice} onChange={(event) => update("costPrice", event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode / QR payload</Label>
              <Input id="barcode" value={draft.barcode} onChange={(event) => update("barcode", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variants">Variants</Label>
              <Input id="variants" value={draft.variants} onChange={(event) => update("variants", event.target.value)} placeholder="Size, Color" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch">Batch number</Label>
              <Input id="batch" value={draft.batchNumber} onChange={(event) => update("batchNumber", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry date</Label>
              <Input id="expiry" type="date" value={draft.expiryDate} onChange={(event) => update("expiryDate", event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="reorder">Reorder level</Label>
              <Input id="reorder" type="number" value={draft.reorderLevel} onChange={(event) => update("reorderLevel", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier details</Label>
              <Input id="supplier" value={draft.supplier} onChange={(event) => update("supplier", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Product image URL</Label>
              <div className="relative">
                <ImagePlus className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="image" value={draft.imageUrl} onChange={(event) => update("imageUrl", event.target.value)} className="pl-9" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <Button type="submit">
              <Plus />
              Save Product
            </Button>
            <BarcodeScanner onScan={(value) => update("barcode", value)} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
