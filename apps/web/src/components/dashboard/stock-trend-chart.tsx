"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { stockTrend } from "@/lib/demo-data";

export function StockTrendChart() {
  return (
    <Card className="min-h-[380px]">
      <CardHeader>
        <CardTitle>Stock Movement Trend</CardTitle>
        <CardDescription>Inward, outward, and closing stock over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent className="h-[290px]">
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
