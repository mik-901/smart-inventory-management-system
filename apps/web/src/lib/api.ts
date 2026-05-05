import {
  activities,
  dashboardStats,
  inventory,
  notifications,
  orders,
  products,
  reportRows,
  returns,
  users,
  warehouses
} from "@/lib/demo-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type DemoMap = {
  "/api/dashboard": typeof dashboardStats;
  "/api/products": typeof products;
  "/api/inventory": typeof inventory;
  "/api/warehouses": typeof warehouses;
  "/api/orders": typeof orders;
  "/api/returns": typeof returns;
  "/api/reports": typeof reportRows;
  "/api/users": typeof users;
  "/api/activity": typeof activities;
  "/api/notifications": typeof notifications;
};

const fallback: DemoMap = {
  "/api/dashboard": dashboardStats,
  "/api/products": products,
  "/api/inventory": inventory,
  "/api/warehouses": warehouses,
  "/api/orders": orders,
  "/api/returns": returns,
  "/api/reports": reportRows,
  "/api/users": users,
  "/api/activity": activities,
  "/api/notifications": notifications
};

export async function getApi<K extends keyof DemoMap>(path: K): Promise<DemoMap[K]> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: {
        "Content-Type": "application/json"
      },
      next: { revalidate: 30 }
    });

    if (!response.ok) throw new Error(`API failed: ${response.status}`);
    const payload = await response.json();
    return (payload.data ?? payload) as DemoMap[K];
  } catch {
    return fallback[path];
  }
}

export function reportExportUrl(report: string, format: "csv" | "pdf" | "xlsx") {
  return `${API_URL}/api/reports/export?report=${encodeURIComponent(report)}&format=${format}`;
}
