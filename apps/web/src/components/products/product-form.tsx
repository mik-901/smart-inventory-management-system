"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { CheckCircle, ImagePlus, Loader2, Plus, ScanLine, XCircle } from "lucide-react";
import { toast } from "sonner";

import { BarcodeScanner } from "@/components/scanner/barcode-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getAccessToken } from "@/lib/auth-context";
import { generateSku } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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
  description: string;
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
  imageUrl: "",
  description: ""
};

type LookupState = "idle" | "loading" | "found" | "not_found";

const SOURCE_LABELS: Record<string, string> = {
  inventory: "Already in your inventory",
  catalog: "Matched in local catalog",
  openfoodfacts: "Found via Open Food Facts",
  upcitemdb: "Found via UPC Item DB"
};

export function ProductForm({ onCreate }: { onCreate: (draft: ProductDraft) => void }) {
  const [draft, setDraft] = useState(initialDraft);
  const [lookupState, setLookupState] = useState<LookupState>("idle");
  const [lookupSource, setLookupSource] = useState<string | null>(null);

  const generatedSku = useMemo(() => generateSku(draft.name || "Product", Date.now() % 9999), [draft.name]);

  const update = (key: keyof ProductDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCreate({ ...draft, sku: draft.sku || generatedSku });
    setDraft(initialDraft);
    setLookupState("idle");
    setLookupSource(null);
  };

  const handleScan = useCallback(async (scannedCode: string) => {
    update("barcode", scannedCode);
    setLookupState("loading");
    setLookupSource(null);

    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/products/barcode/${encodeURIComponent(scannedCode)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Lookup failed");
      const body = await res.json();

      if (body.data?.found && body.data.product) {
        const p = body.data.product;
        setDraft((current) => ({
          ...current,
          barcode: scannedCode,
          name: p.name || current.name,
          brand: p.brand || current.brand,
          category: p.category || current.category,
          price: p.sellingPrice ? String(p.sellingPrice) : current.price,
          costPrice: p.costPrice ? String(p.costPrice) : current.costPrice,
          imageUrl: p.imageUrl || current.imageUrl,
          description: p.description || current.description,
          supplier: p.supplier || p.brand || current.supplier
        }));
        setLookupState("found");
        setLookupSource(body.data.source ?? null);
        toast.success(`✅ Found: ${p.name}`, {
          description: SOURCE_LABELS[body.data.source] ?? body.data.source
        });
      } else {
        setLookupState("not_found");
        toast.warning("⚠️ Barcode not in any database", {
          description: "Please fill in the product details manually."
        });
      }
    } catch {
      setLookupState("not_found");
      toast.error("Barcode lookup failed — fill manually");
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Product / SKU</CardTitle>
        <CardDescription>
          Scan a real product barcode to auto-fill details from our 200+ product catalog, Open Food Facts, and UPC databases.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={submit}>

          {/* Lookup status banner */}
          {lookupState === "loading" && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
              <Loader2 className="size-4 animate-spin" />
              Looking up barcode in catalog and external databases…
            </div>
          )}
          {lookupState === "found" && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">
              <CheckCircle className="size-4" />
              <span>
                <strong>Product auto-filled</strong>
                {lookupSource && ` · ${SOURCE_LABELS[lookupSource] ?? lookupSource}`}
                {" — review and adjust before saving."}
              </span>
            </div>
          )}
          {lookupState === "not_found" && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <XCircle className="size-4" />
              Barcode not found — fill in the details below manually.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Product name</Label>
              <Input id="name" required value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder="Parle-G Original Gluco Biscuits 800g" />
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
                <option>Food &amp; Beverages</option>
                <option>Personal Care</option>
                <option>Office Supplies</option>
                <option>Household</option>
                <option>Health</option>
                <option>Packaging</option>
                <option>Clothing</option>
                <option>Consumables</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" value={draft.brand} onChange={(event) => update("brand", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Selling price</Label>
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
              <Input id="barcode" value={draft.barcode} onChange={(event) => update("barcode", event.target.value)} placeholder="Scan or type EAN-13" />
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
              <Label htmlFor="supplier">Supplier</Label>
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

          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <Button type="submit">
              <Plus />
              Save Product
            </Button>

            {/* Scanner with lookup badge */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ScanLine className="size-4" />
                Scan to auto-fill from 200+ product catalog
              </div>
              <BarcodeScanner onScan={handleScan} />
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
