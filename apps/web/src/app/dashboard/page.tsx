"use client";

import { AlertTriangle, Boxes, IndianRupee, Package, ShoppingCart } from "lucide-react";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ReorderWidget } from "@/components/dashboard/reorder-widget";
import { StockTrendChart } from "@/components/dashboard/stock-trend-chart";
import { WarehousePerformanceChart } from "@/components/dashboard/warehouse-performance-chart";
import { AppShell } from "@/components/layout/app-shell";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function DashboardPage() {
  const { data: dashboardStats } = useDashboard();

  return (
    <AppShell title="Dashboard" subtitle="Realtime command center for stock, revenue, orders, and warehouse health.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Total Products" value={formatNumber(dashboardStats.totalProducts ?? 0)} trend="Live catalog count" icon={Package} />
        <KpiCard
          title="Total Stock Value"
          value={formatCurrency(dashboardStats.totalStockValue ?? 0)}
          trend="Quantity × cost"
          icon={Boxes}
          tone="blue"
        />
        <KpiCard
          title="Low Stock Items"
          value={formatNumber(dashboardStats.lowStockItems ?? dashboardStats.lowStockCount ?? 0)}
          trend="Below reorder point"
          icon={AlertTriangle}
          tone="amber"
        />
        <KpiCard title="Orders Today" value={formatNumber(dashboardStats.ordersToday ?? 0)} trend="PO + SO count" icon={ShoppingCart} tone="emerald" />
        <KpiCard title="Revenue" value={formatCurrency(dashboardStats.revenue ?? dashboardStats.revenueToday ?? 0)} trend="Confirmed sales today" icon={IndianRupee} tone="rose" />
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
