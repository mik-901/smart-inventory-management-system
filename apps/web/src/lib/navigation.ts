import {
  Activity,
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  LayoutDashboard,
  Package,
  RotateCcw,
  Settings,
  ShieldCheck,
  Truck
} from "lucide-react";

export const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/warehouses", label: "Warehouses", icon: Building2 },
  { href: "/orders", label: "Orders", icon: Truck },
  { href: "/returns", label: "Returns", icon: RotateCcw },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/users", label: "Users & Roles", icon: ShieldCheck },
  { href: "/activity", label: "Activity Logs", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/orders?tab=purchase", label: "Purchase Orders", icon: ClipboardList, secondary: true }
];
