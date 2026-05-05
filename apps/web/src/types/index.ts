export type UserRole = "SUPER_ADMIN" | "MANAGER" | "WAREHOUSE_STAFF" | "VIEWER";

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: number;
  costPrice: number;
  barcode: string;
  variants: string[];
  batchNumber: string;
  expiryDate: string;
  reorderLevel: number;
  supplier: string;
  imageUrl: string;
  stock: number;
  status: "Healthy" | "Low Stock" | "Overstock" | "Expiring";
};

export type Warehouse = {
  id: string;
  name: string;
  code: string;
  city: string;
  manager: string;
  capacity: number;
  utilization: number;
  stockValue: number;
  ordersToday: number;
};

export type InventoryItem = {
  id: string;
  product: string;
  sku: string;
  warehouse: string;
  available: number;
  reserved: number;
  damaged: number;
  reorderLevel: number;
  lastSync: string;
};

export type Order = {
  id: string;
  number: string;
  type: "Purchase" | "Sales" | "Transfer";
  status: "Draft" | "Approved" | "Dispatched" | "Received" | "Returned" | "Cancelled";
  party: string;
  warehouse: string;
  amount: number;
  date: string;
};

export type ReturnRecord = {
  id: string;
  number: string;
  orderNumber: string;
  reason: string;
  status: string;
  items: number;
  warehouse: string;
  date: string;
};

export type Activity = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  time: string;
  tone: "success" | "warning" | "info" | "danger";
};

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastLogin: string;
  status: "Active" | "Invited" | "Suspended";
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: "LOW_STOCK" | "REORDER" | "SYSTEM" | "ORDER";
  read: boolean;
  time: string;
};
