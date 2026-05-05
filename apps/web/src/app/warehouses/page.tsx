import { Building2, MapPin, PackageCheck, Truck } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { warehouses } from "@/lib/demo-data";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function WarehousesPage() {
  return (
    <AppShell title="Warehouses" subtitle="Regional stock visibility, capacity utilization, and fulfillment performance.">
      <div className="grid gap-4 md:grid-cols-3">
        {warehouses.map((warehouse) => (
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
            <Button>
              <PackageCheck />
              Add Warehouse
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Stock Value</TableHead>
                <TableHead>Orders Today</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Dispatch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.map((warehouse) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
