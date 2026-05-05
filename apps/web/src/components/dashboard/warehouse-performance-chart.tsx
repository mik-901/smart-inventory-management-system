"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { warehousePerformance } from "@/lib/demo-data";

export function WarehousePerformanceChart() {
  return (
    <Card className="min-h-[380px]">
      <CardHeader>
        <CardTitle>Warehouse Performance</CardTitle>
        <CardDescription>Utilization, picking accuracy, and order load</CardDescription>
      </CardHeader>
      <CardContent className="h-[290px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={warehousePerformance}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.18} vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={12} />
            <YAxis tickLine={false} axisLine={false} width={36} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))"
              }}
            />
            <Bar dataKey="utilization" radius={[6, 6, 0, 0]} fill="#14b8a6" />
            <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} fill="#38bdf8" />
            <Bar dataKey="orders" radius={[6, 6, 0, 0]} fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
