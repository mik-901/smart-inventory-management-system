"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { inventoryApi } from "@/lib/api/inventory";
import { useApiQuery } from "@/hooks/useApiResource";

export function StockTrendChart() {
  const { data: movements } = useApiQuery<any[]>(() => inventoryApi.movements({ limit: 200 }) as Promise<any[]>, [], { initialData: [] });
  const stockTrend = Object.values(
    movements.reduce<Record<string, { date: string; inward: number; outward: number }>>((acc, movement: any) => {
      const date = String(movement.created_at ?? movement.createdAt ?? "").slice(0, 10);
      if (!date) return acc;
      acc[date] ??= { date, inward: 0, outward: 0 };
      const quantity = Number(movement.quantity ?? 0);
      const type = String(movement.movement_type ?? movement.movementType);
      if (["purchase", "transfer_in", "return", "adjustment"].includes(type)) acc[date].inward += quantity;
      if (["sale", "transfer_out", "damage"].includes(type)) acc[date].outward += quantity;
      return acc;
    }, {})
  ).slice(-7);

  return (
    <Card className="min-h-[380px] flex flex-col">
      <CardHeader>
        <CardTitle>Stock Movement Trend</CardTitle>
        <CardDescription>Inward, outward, and closing stock over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-[250px]" style={{ height: '280px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={stockTrend}>
            <defs>
              <linearGradient id="stockGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="outwardGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.18} vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={12} />
            <YAxis tickLine={false} axisLine={false} width={46} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))"
              }}
            />
            <Area type="monotone" dataKey="inward" stroke="#14b8a6" fill="url(#stockGradient)" strokeWidth={2.4} />
            <Area type="monotone" dataKey="outward" stroke="#f59e0b" fill="url(#outwardGradient)" strokeWidth={2.4} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
