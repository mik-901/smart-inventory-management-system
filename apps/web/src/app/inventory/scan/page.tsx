"use client";

import { useState } from "react";
import { PackageSearch, Boxes, ScanLine } from "lucide-react";
import { toast } from "sonner";

import { BarcodeScanner } from "@/components/scanner/barcode-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/hooks/useProducts";
import { useInventory } from "@/hooks/useInventory";
import { useWarehouses } from "@/hooks/useWarehouses";

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const { data: products } = useProducts();
  const { data: inventory } = useInventory();
  const { data: warehouses } = useWarehouses();

  const handleScanSuccess = (decodedText: string) => {
    setScannedCode(decodedText);
    setScanning(false);
    toast.success(`Scanned: ${decodedText}`);
    
    // Find product by SKU or Barcode
    const product = products?.find(p => p.sku === decodedText || p.barcode === decodedText);
    if (!product) {
      toast.error("Product not found in database.");
      return;
    }

    // In a full implementation, this would open a modal to select Warehouse, Quantity, and Action (Add/Remove)
    toast.success(`Found product: ${product.name}. Ready for adjustment.`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Barcode Scanner</h1>
        <p className="text-muted-foreground mt-2">
          Use your device camera or external scanner to quickly look up SKUs and adjust stock.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-primary" />
              Scan Item
            </CardTitle>
            <CardDescription>Point your camera at a product barcode or QR code.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center gap-4">
            {scanning ? (
              <BarcodeScanner onScanSuccess={handleScanSuccess} onClose={() => setScanning(false)} />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-muted/30">
                <ScanLine className="w-12 h-12 text-muted-foreground mb-4" />
                <Button size="lg" onClick={() => setScanning(true)}>
                  Start Camera Scanner
                </Button>
              </div>
            )}
            
            <div className="relative mt-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or Enter Manually</span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Input 
                placeholder="Enter Barcode or SKU..." 
                value={scannedCode} 
                onChange={e => setScannedCode(e.target.value)} 
                onKeyDown={e => {
                  if (e.key === 'Enter' && scannedCode) {
                    handleScanSuccess(scannedCode);
                  }
                }}
              />
              <Button onClick={() => scannedCode && handleScanSuccess(scannedCode)}>
                Lookup
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageSearch className="w-5 h-5 text-primary" />
              Scanned Product
            </CardTitle>
            <CardDescription>Product details will appear here after scanning.</CardDescription>
          </CardHeader>
          <CardContent>
            {scannedCode ? (() => {
              const product = products?.find(p => p.sku === scannedCode || p.barcode === scannedCode);
              if (!product) {
                return (
                  <div className="text-center p-8 text-muted-foreground">
                    <p>No product found for code: <span className="font-mono text-foreground">{scannedCode}</span></p>
                  </div>
                );
              }
              
              const productStock = inventory?.filter(i => i.product_id === product.id) || [];
              
              return (
                <div className="space-y-6">
                  <div className="flex gap-4 items-start">
                    {product.image_url && (
                      <img src={product.image_url} alt={product.name} className="w-20 h-20 rounded-md object-cover border bg-muted" />
                    )}
                    <div>
                      <h3 className="font-medium text-lg">{product.name}</h3>
                      <p className="text-sm font-mono text-muted-foreground">{product.sku}</p>
                      <Badge variant={product.is_active ? "success" : "secondary"} className="mt-2">
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Boxes className="w-4 h-4" /> Current Locations
                    </h4>
                    {productStock.length > 0 ? (
                      <div className="space-y-2">
                        {productStock.map(stock => {
                          const wh = warehouses?.find(w => w.id === stock.warehouse_id);
                          return (
                            <div key={stock.id} className="flex justify-between items-center text-sm">
                              <span>{wh?.name || 'Unknown Location'}</span>
                              <span className="font-medium">{stock.available_quantity} {product.unit_of_measure}s</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No stock across any warehouse.</p>
                    )}
                  </div>
                  
                  <Button className="w-full" asChild>
                    <a href={`/inventory?sku=${product.sku}`}>
                      Adjust Stock for {product.name}
                    </a>
                  </Button>
                </div>
              );
            })() : (
              <div className="text-center p-12 text-muted-foreground flex flex-col items-center">
                <Boxes className="w-12 h-12 mb-4 opacity-20" />
                <p>Scan a product to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Ensure we have access to Badge component
import { Badge } from "@/components/ui/badge";
