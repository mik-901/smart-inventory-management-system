"use client";

import { AlertTriangle, Boxes, IndianRupee, Package, ShoppingCart } from "lucide-react";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ReorderWidget } from "@/components/dashboard/reorder-widget";
import { StockTrendChart } from "@/components/dashboard/stock-trend-chart";
import { WarehousePerformanceChart } from "@/components/dashboard/warehouse-performance-chart";
import { AppShell } from "@/components/layout/app-shell";
import { dashboardStats } from "@/lib/demo-data";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard" subtitle="Realtime command center for stock, revenue, orders, and warehouse health.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Total Products" value={formatNumber(dashboardStats.totalProducts)} trend="+12 SKUs this month" icon={Package} />
        <KpiCard
          title="Total Stock Value"
          value={formatCurrency(dashboardStats.totalStockValue)}
          trend="+8.4% vs last month"
          icon={Boxes}
          tone="blue"
        />
        <KpiCard
          title="Low Stock Items"
          value={formatNumber(dashboardStats.lowStockItems)}
          trend="2 need purchase review"
          icon={AlertTriangle}
          tone="amber"
        />
        <KpiCard title="Orders Today" value={formatNumber(dashboardStats.ordersToday)} trend="94% on-time dispatch" icon={ShoppingCart} tone="emerald" />
        <KpiCard title="Revenue" value={formatCurrency(dashboardStats.revenue)} trend="+14.7% today" icon={IndianRupee} tone="rose" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <StockTrendChart />
        <WarehousePerformanceChart />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <ReorderWidget />
        <ActivityFeed />
      </div>
    </AppShell>
  );
}
