export type Role = "SUPER_ADMIN" | "MANAGER" | "WAREHOUSE_STAFF" | "VIEWER";

export const demoStore = {
  dashboard: {
    totalProducts: 5,
    totalStockValue: 2174670,
    lowStockItems: 2,
    ordersToday: 163,
    revenue: 1845000
  },
  users: [
    { id: "usr-001", name: "Aarav Mehta", email: "admin@demo.com", role: "SUPER_ADMIN" as Role, passwordHash: "", lastLogin: "Now", status: "Active" },
    { id: "usr-002", name: "Maya Kapoor", email: "manager@demo.com", role: "MANAGER" as Role, passwordHash: "", lastLogin: "2 hours ago", status: "Active" },
    { id: "usr-003", name: "Kabir Sethi", email: "staff@demo.com", role: "WAREHOUSE_STAFF" as Role, passwordHash: "", lastLogin: "Yesterday", status: "Active" },
    { id: "usr-004", name: "Nisha Rao", email: "viewer@demo.com", role: "VIEWER" as Role, passwordHash: "", lastLogin: "3 days ago", status: "Invited" }
  ],
  products: [
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
    }
  ],
  warehouses: [
    { id: "wh-001", name: "Mumbai Central Hub", code: "MUM-CEN", city: "Mumbai", manager: "Maya Kapoor", capacity: 12000, utilization: 76.2, stockValue: 18450000, ordersToday: 58 },
    { id: "wh-002", name: "Delhi North DC", code: "DEL-NOR", city: "Delhi", manager: "Kabir Sethi", capacity: 9000, utilization: 63.4, stockValue: 12780000, ordersToday: 41 },
    { id: "wh-003", name: "Bengaluru South Fulfillment", code: "BLR-SOU", city: "Bengaluru", manager: "Kabir Sethi", capacity: 10500, utilization: 82.1, stockValue: 15920000, ordersToday: 64 }
  ],
  inventory: [
    { id: "inv-001", product: "AeroTrack RFID Tag Pack", sku: "SKU-AER-0001", warehouse: "Mumbai Central Hub", available: 420, reserved: 30, damaged: 4, reorderLevel: 120, lastSync: "Live" },
    { id: "inv-002", product: "NovaScan Wireless Scanner", sku: "SKU-NOV-0002", warehouse: "Mumbai Central Hub", available: 21, reserved: 5, damaged: 0, reorderLevel: 25, lastSync: "Live" }
  ],
  orders: [
    { id: "ord-001", number: "PO-2026-1001", type: "Purchase", status: "Approved", party: "Northstar Components", warehouse: "Mumbai Central Hub", amount: 125000, date: "2026-05-01" },
    { id: "ord-002", number: "SO-2026-2042", type: "Sales", status: "Dispatched", party: "BrightMart Retail", warehouse: "Bengaluru South Fulfillment", amount: 87950, date: "2026-05-01" }
  ],
  returns: [
    { id: "ret-001", number: "RT-2026-0091", orderNumber: "SO-2026-2042", reason: "Damaged during transit", status: "Inspection", items: 6, warehouse: "Bengaluru South Fulfillment", date: "2026-05-01" }
  ],
  activities: [
    { id: "act-001", actor: "Maya Kapoor", action: "approved purchase order", entity: "PO-2026-1001", time: "12 min ago", tone: "success" },
    { id: "act-002", actor: "Kabir Sethi", action: "adjusted damaged stock", entity: "Retail Shelf Sensor", time: "39 min ago", tone: "warning" }
  ],
  notifications: [
    { id: "ntf-001", title: "Low stock warning", message: "NovaScan Scanner is close to reorder level in Mumbai.", type: "LOW_STOCK", read: false, time: "4 min ago" },
    { id: "ntf-002", title: "Purchase order suggestion", message: "Suggested PO: 160 ShelfSense sensors for Bengaluru.", type: "REORDER", read: false, time: "26 min ago" }
  ]
};
