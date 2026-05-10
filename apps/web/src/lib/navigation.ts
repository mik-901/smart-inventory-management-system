import {
  Activity,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  ClipboardList,
  LayoutDashboard,
  Package,
  RotateCcw,
  Settings,
  ShieldCheck,
  Truck,
  ScanLine
} from "lucide-react";

export const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/inventory/scan", label: "Scan Barcode", icon: ScanLine },
  { href: "/warehouses", label: "Warehouses", icon: Building2 },
  { href: "/orders", label: "Orders", icon: Truck },
  { href: "/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
  { href: "/sales-orders", label: "Sales Orders", icon: Truck },
  { href: "/transfers", label: "Transfers", icon: Boxes },
  { href: "/returns", label: "Returns", icon: RotateCcw },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/users", label: "Users & Roles", icon: ShieldCheck },
  { href: "/activity", label: "Activity Logs", icon: Activity },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings }
];
