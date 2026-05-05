import type {
  Activity,
  AppUser,
  InventoryItem,
  NotificationItem,
  Order,
  Product,
  ReturnRecord,
  Warehouse
} from "@/types";

export const demoCredentials = [
  { email: "admin@demo.com", password: "inventory123", role: "SUPER_ADMIN", name: "Aarav Mehta" },
  { email: "manager@demo.com", password: "inventory123", role: "MANAGER", name: "Maya Kapoor" },
  { email: "staff@demo.com", password: "inventory123", role: "WAREHOUSE_STAFF", name: "Kabir Sethi" },
  { email: "viewer@demo.com", password: "inventory123", role: "VIEWER", name: "Nisha Rao" }
] as const;

export const products: Product[] = [
  {
    id: "prd-001",
    name: "AeroTrack RFID Tag Pack",
    sku: "SKU-AER-0001",
    category: "Electronics",
    brand: "AeroTrack",
    price: 1199,
    costPrice: 650,
    barcode: "890100000001",
    variants: ["50-pack", "Graphite"],
    batchNumber: "AT-2404",
    expiryDate: "2028-04-30",
    reorderLevel: 120,
    supplier: "Northstar Components",
    imageUrl: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?w=800",
    stock: 580,
    status: "Healthy"
  },
  {
    id: "prd-002",
    name: "NovaScan Wireless Scanner",
    sku: "SKU-NOV-0002",
    category: "Hardware",
    brand: "NovaScan",
    price: 8499,
    costPrice: 5100,
    barcode: "890100000002",
    variants: ["Standard", "Black"],
    batchNumber: "NS-2405",
    expiryDate: "2029-01-20",
    reorderLevel: 25,
    supplier: "Northstar Components",
    imageUrl: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800",
    stock: 65,
    status: "Low Stock"
  },
  {
    id: "prd-003",
    name: "ColdChain Label Roll",
    sku: "SKU-COL-0003",
    category: "Packaging",
    brand: "PrimePack",
    price: 449,
    costPrice: 210,
    barcode: "890100000003",
    variants: ["1000 labels", "White"],
    batchNumber: "CC-2402",
    expiryDate: "2027-08-15",
    reorderLevel: 300,
    supplier: "Prime Packaging Co.",
    imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800",
    stock: 920,
    status: "Overstock"
  },
  {
    id: "prd-004",
    name: "Retail Shelf Sensor",
    sku: "SKU-RET-0004",
    category: "IoT",
    brand: "ShelfSense",
    price: 3299,
    costPrice: 1990,
    barcode: "890100000004",
    variants: ["Mini", "Silver", "Pro", "Black"],
    batchNumber: "RS-2401",
    expiryDate: "2028-11-10",
    reorderLevel: 60,
    supplier: "Urban Retail Supply",
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
    stock: 54,
    status: "Low Stock"
  },
  {
    id: "prd-005",
    name: "Thermal Printer Ribbon",
    sku: "SKU-THE-0005",
    category: "Consumables",
    brand: "PrintEdge",
    price: 799,
    costPrice: 360,
    barcode: "890100000005",
    variants: ["110mm x 300m", "Black"],
    batchNumber: "TP-2406",
    expiryDate: "2027-12-01",
    reorderLevel: 180,
    supplier: "Prime Packaging Co.",
    imageUrl: "https://images.unsplash.com/photo-1581091870627-3f619f8d999f?w=800",
    stock: 175,
    status: "Expiring"
  }
];

export const warehouses: Warehouse[] = [
  {
    id: "wh-001",
    name: "Mumbai Central Hub",
    code: "MUM-CEN",
    city: "Mumbai",
    manager: "Maya Kapoor",
    capacity: 12000,
    utilization: 76.2,
    stockValue: 18450000,
    ordersToday: 58
  },
  {
    id: "wh-002",
    name: "Delhi North DC",
    code: "DEL-NOR",
    city: "Delhi",
    manager: "Kabir Sethi",
    capacity: 9000,
    utilization: 63.4,
    stockValue: 12780000,
    ordersToday: 41
  },
  {
    id: "wh-003",
    name: "Bengaluru South Fulfillment",
    code: "BLR-SOU",
    city: "Bengaluru",
    manager: "Kabir Sethi",
    capacity: 10500,
    utilization: 82.1,
    stockValue: 15920000,
    ordersToday: 64
  }
];

export const inventory: InventoryItem[] = [
  {
    id: "inv-001",
    product: "AeroTrack RFID Tag Pack",
    sku: "SKU-AER-0001",
    warehouse: "Mumbai Central Hub",
    available: 420,
    reserved: 30,
    damaged: 4,
    reorderLevel: 120,
    lastSync: "18 sec ago"
  },
  {
    id: "inv-002",
    product: "NovaScan Wireless Scanner",
    sku: "SKU-NOV-0002",
    warehouse: "Mumbai Central Hub",
    available: 21,
    reserved: 5,
    damaged: 0,
    reorderLevel: 25,
    lastSync: "32 sec ago"
  },
  {
    id: "inv-003",
    product: "ColdChain Label Roll",
    sku: "SKU-COL-0003",
    warehouse: "Delhi North DC",
    available: 920,
    reserved: 120,
    damaged: 8,
    reorderLevel: 300,
    lastSync: "1 min ago"
  },
  {
    id: "inv-004",
    product: "Retail Shelf Sensor",
    sku: "SKU-RET-0004",
    warehouse: "Bengaluru South Fulfillment",
    available: 54,
    reserved: 11,
    damaged: 2,
    reorderLevel: 60,
    lastSync: "Live"
  },
  {
    id: "inv-005",
    product: "Thermal Printer Ribbon",
    sku: "SKU-THE-0005",
    warehouse: "Mumbai Central Hub",
    available: 175,
    reserved: 32,
    damaged: 3,
    reorderLevel: 180,
    lastSync: "Live"
  }
];

export const orders: Order[] = [
  {
    id: "ord-001",
    number: "PO-2026-1001",
    type: "Purchase",
    status: "Approved",
    party: "Northstar Components",
    warehouse: "Mumbai Central Hub",
    amount: 125000,
    date: "2026-05-01"
  },
  {
    id: "ord-002",
    number: "SO-2026-2042",
    type: "Sales",
    status: "Dispatched",
    party: "BrightMart Retail",
    warehouse: "Bengaluru South Fulfillment",
    amount: 87950,
    date: "2026-05-01"
  },
  {
    id: "ord-003",
    number: "TO-2026-0312",
    type: "Transfer",
    status: "Received",
    party: "Internal transfer",
    warehouse: "Mumbai -> Delhi",
    amount: 0,
    date: "2026-04-29"
  },
  {
    id: "ord-004",
    number: "SO-2026-2046",
    type: "Sales",
    status: "Draft",
    party: "Metro Fresh",
    warehouse: "Delhi North DC",
    amount: 42600,
    date: "2026-05-02"
  }
];

export const returns: ReturnRecord[] = [
  {
    id: "ret-001",
    number: "RT-2026-0091",
    orderNumber: "SO-2026-2042",
    reason: "Damaged during transit",
    status: "Inspection",
    items: 6,
    warehouse: "Bengaluru South Fulfillment",
    date: "2026-05-01"
  },
  {
    id: "ret-002",
    number: "RT-2026-0092",
    orderNumber: "SO-2026-2019",
    reason: "Wrong variant shipped",
    status: "Restocked",
    items: 3,
    warehouse: "Delhi North DC",
    date: "2026-04-30"
  }
];

export const activities: Activity[] = [
  {
    id: "act-001",
    actor: "Maya Kapoor",
    action: "approved purchase order",
    entity: "PO-2026-1001",
    time: "12 min ago",
    tone: "success"
  },
  {
    id: "act-002",
    actor: "Kabir Sethi",
    action: "adjusted damaged stock",
    entity: "Retail Shelf Sensor",
    time: "39 min ago",
    tone: "warning"
  },
  {
    id: "act-003",
    actor: "Aarav Mehta",
    action: "updated reorder level",
    entity: "NovaScan Wireless Scanner",
    time: "1 hr ago",
    tone: "info"
  },
  {
    id: "act-004",
    actor: "System",
    action: "generated low-stock notification",
    entity: "Thermal Printer Ribbon",
    time: "2 hrs ago",
    tone: "danger"
  }
];

export const users: AppUser[] = [
  {
    id: "usr-001",
    name: "Aarav Mehta",
    email: "admin@demo.com",
    role: "SUPER_ADMIN",
    lastLogin: "Now",
    status: "Active"
  },
  {
    id: "usr-002",
    name: "Maya Kapoor",
    email: "manager@demo.com",
    role: "MANAGER",
    lastLogin: "2 hours ago",
    status: "Active"
  },
  {
    id: "usr-003",
    name: "Kabir Sethi",
    email: "staff@demo.com",
    role: "WAREHOUSE_STAFF",
    lastLogin: "Yesterday",
    status: "Active"
  },
  {
    id: "usr-004",
    name: "Nisha Rao",
    email: "viewer@demo.com",
    role: "VIEWER",
    lastLogin: "3 days ago",
    status: "Invited"
  }
];

export const notifications: NotificationItem[] = [
  {
    id: "ntf-001",
    title: "Low stock warning",
    message: "NovaScan Scanner is close to reorder level in Mumbai.",
    type: "LOW_STOCK",
    read: false,
    time: "4 min ago"
  },
  {
    id: "ntf-002",
    title: "Purchase order suggestion",
    message: "Suggested PO: 160 ShelfSense sensors for Bengaluru.",
    type: "REORDER",
    read: false,
    time: "26 min ago"
  },
  {
    id: "ntf-003",
    title: "Dispatch complete",
    message: "SO-2026-2042 has moved to dispatched.",
    type: "ORDER",
    read: true,
    time: "1 hr ago"
  }
];

export const stockTrend = [
  { date: "Apr 26", inward: 1280, outward: 940, stock: 18400 },
  { date: "Apr 27", inward: 1120, outward: 1020, stock: 18500 },
  { date: "Apr 28", inward: 1480, outward: 1180, stock: 18800 },
  { date: "Apr 29", inward: 980, outward: 1220, stock: 18560 },
  { date: "Apr 30", inward: 1670, outward: 1300, stock: 18930 },
  { date: "May 01", inward: 1390, outward: 980, stock: 19340 },
  { date: "May 02", inward: 1520, outward: 1100, stock: 19760 }
];

export const warehousePerformance = [
  { name: "Mumbai", utilization: 76, accuracy: 98, orders: 58 },
  { name: "Delhi", utilization: 63, accuracy: 96, orders: 41 },
  { name: "Bengaluru", utilization: 82, accuracy: 97, orders: 64 },
  { name: "Pune", utilization: 54, accuracy: 94, orders: 29 }
];

export const categoryMix = [
  { name: "Electronics", value: 34 },
  { name: "Hardware", value: 26 },
  { name: "IoT", value: 18 },
  { name: "Packaging", value: 14 },
  { name: "Consumables", value: 8 }
];

export const reorderSuggestions = [
  {
    sku: "SKU-RET-0004",
    product: "Retail Shelf Sensor",
    suggestedQty: 160,
    confidence: 91,
    reason: "Demand has risen 18% across Bengaluru retail orders."
  },
  {
    sku: "SKU-THE-0005",
    product: "Thermal Printer Ribbon",
    suggestedQty: 240,
    confidence: 86,
    reason: "Projected 12-day stockout based on sales velocity."
  }
];

export const reportRows = [
  { report: "Stock valuation", owner: "Finance", rows: 1248, freshness: "Live", format: "PDF / Excel / CSV" },
  { report: "Movement history", owner: "Operations", rows: 8920, freshness: "5 min", format: "Excel / CSV" },
  { report: "Dead stock report", owner: "Procurement", rows: 84, freshness: "Daily", format: "PDF / CSV" },
  { report: "Aging report", owner: "Compliance", rows: 302, freshness: "Hourly", format: "PDF / Excel" },
  { report: "ABC analysis", owner: "Planning", rows: 512, freshness: "Daily", format: "Excel" },
  { report: "Warehouse wise report", owner: "Regional Ops", rows: 318, freshness: "Live", format: "PDF / Excel / CSV" },
  { report: "Supplier wise report", owner: "Procurement", rows: 126, freshness: "Daily", format: "Excel / CSV" }
];

export const dashboardStats = {
  totalProducts: products.length,
  totalStockValue: products.reduce((sum, product) => sum + product.stock * product.costPrice, 0),
  lowStockItems: products.filter((product) => product.stock <= product.reorderLevel).length,
  ordersToday: 163,
  revenue: 1845000
};
