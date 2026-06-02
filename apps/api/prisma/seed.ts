import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function main() {
  console.log("🌱 Seeding database…");

  // Clear existing data to allow re-seeding
  await prisma.transferItem.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.supplier.deleteMany();
  // ── Users ──────────────────────────────────────────────────────────────
  const passwordHash = await hashPassword("Inventory123");

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: { name: "Aarav Mehta", email: "admin@demo.com", passwordHash, role: "admin" }
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@demo.com" },
    update: {},
    create: { name: "Maya Kapoor", email: "manager@demo.com", passwordHash, role: "manager" }
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@demo.com" },
    update: {},
    create: { name: "Rohan Singh", email: "staff@demo.com", passwordHash, role: "staff" }
  });

  await prisma.user.upsert({
    where: { email: "viewer@demo.com" },
    update: {},
    create: { name: "Priya Sharma", email: "viewer@demo.com", passwordHash, role: "viewer" }
  });

  // ── Categories ─────────────────────────────────────────────────────────
  const electronics = await prisma.category.upsert({
    where: { name: "Electronics" },
    update: {},
    create: { name: "Electronics", description: "Electronic devices and components" }
  });

  const clothing = await prisma.category.upsert({
    where: { name: "Clothing" },
    update: {},
    create: { name: "Clothing", description: "Apparel and garments" }
  });

  const food = await prisma.category.upsert({
    where: { name: "Food & Beverages" },
    update: {},
    create: { name: "Food & Beverages", description: "Food items and beverages" }
  });

  const office = await prisma.category.upsert({
    where: { name: "Office Supplies" },
    update: {},
    create: { name: "Office Supplies", description: "Office equipment and stationery" }
  });

  // ── Suppliers ──────────────────────────────────────────────────────────
  const supplier1 = await prisma.supplier.create({
    data: {
      name: "TechDistrib India Pvt Ltd",
      contactPerson: "Anil Kumar",
      email: "sales@techdistrib.in",
      phone: "+91-9876543210",
      city: "Mumbai",
      country: "India",
      paymentTerms: "Net 30",
      leadTimeDays: 5
    }
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: "GlobalTex Exporters",
      contactPerson: "Sunita Rao",
      email: "orders@globaltex.com",
      phone: "+91-8765432100",
      city: "Delhi",
      country: "India",
      paymentTerms: "Net 45",
      leadTimeDays: 10
    }
  });

  // ── Warehouses ─────────────────────────────────────────────────────────
  const wh1 = await prisma.warehouse.create({
    data: { name: "Mumbai Central Hub", location: "Andheri East", city: "Mumbai", country: "India", capacity: 10000, managerId: manager.id }
  });

  const wh2 = await prisma.warehouse.create({
    data: { name: "Delhi Distribution Center", location: "Okhla Industrial", city: "Delhi", country: "India", capacity: 8000, managerId: manager.id }
  });

  const wh3 = await prisma.warehouse.create({
    data: { name: "Bangalore Tech Park", location: "Whitefield", city: "Bangalore", country: "India", capacity: 5000 }
  });

  // ── Products ───────────────────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: "SKU-ELEC-0001", name: "Wireless Bluetooth Earbuds", description: "Premium ANC earbuds with 24hr battery",
        categoryId: electronics.id, supplierId: supplier1.id, unitOfMeasure: "piece",
        costPrice: 1200, sellingPrice: 2499, reorderPoint: 50, reorderQuantity: 200,
        barcode: "8901234567890", batchTracking: false, expiryTracking: false,
        imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400"
      }
    }),
    prisma.product.create({
      data: {
        sku: "SKU-ELEC-0002", name: "USB-C Charging Cable 2m", description: "Fast-charging braided nylon cable",
        categoryId: electronics.id, supplierId: supplier1.id, unitOfMeasure: "piece",
        costPrice: 150, sellingPrice: 399, reorderPoint: 100, reorderQuantity: 500,
        barcode: "8901234567891"
      }
    }),
    prisma.product.create({
      data: {
        sku: "SKU-CLTH-0001", name: "Cotton Crew Neck T-Shirt", description: "100% organic cotton, multiple sizes",
        categoryId: clothing.id, supplierId: supplier2.id, unitOfMeasure: "piece",
        costPrice: 250, sellingPrice: 699, reorderPoint: 30, reorderQuantity: 100,
        barcode: "8901234567892"
      }
    }),
    prisma.product.create({
      data: {
        sku: "SKU-FOOD-0001", name: "Premium Green Tea 100g", description: "Organic Japanese green tea",
        categoryId: food.id, supplierId: supplier2.id, unitOfMeasure: "box",
        costPrice: 180, sellingPrice: 450, reorderPoint: 40, reorderQuantity: 150,
        barcode: "8901234567893", batchTracking: true, expiryTracking: true
      }
    }),
    prisma.product.create({
      data: {
        sku: "SKU-OFFC-0001", name: "A4 Copier Paper Ream 500 Sheets", description: "80gsm white copier paper",
        categoryId: office.id, supplierId: supplier1.id, unitOfMeasure: "ream",
        costPrice: 200, sellingPrice: 350, reorderPoint: 20, reorderQuantity: 100,
        barcode: "8901234567894"
      }
    }),
    prisma.product.create({
      data: {
        sku: "SKU-ELEC-0003", name: "10000mAh Power Bank", description: "Compact fast-charge power bank",
        categoryId: electronics.id, supplierId: supplier1.id, unitOfMeasure: "piece",
        costPrice: 600, sellingPrice: 1299, reorderPoint: 25, reorderQuantity: 100,
        barcode: "8901234567895"
      }
    }),
    prisma.product.create({
      data: {
        sku: "SKU-CLTH-0002", name: "Denim Slim Fit Jeans", description: "Stretch denim, dark wash",
        categoryId: clothing.id, supplierId: supplier2.id, unitOfMeasure: "piece",
        costPrice: 600, sellingPrice: 1499, reorderPoint: 15, reorderQuantity: 50,
        barcode: "8901234567896"
      }
    }),
    prisma.product.create({
      data: {
        sku: "SKU-OFFC-0002", name: "Ballpoint Pen Pack (10)", description: "Blue ink, smooth writing",
        categoryId: office.id, supplierId: supplier1.id, unitOfMeasure: "pack",
        costPrice: 80, sellingPrice: 150, reorderPoint: 50, reorderQuantity: 200,
        barcode: "8901234567897"
      }
    })
  ]);

  // ── Inventory ──────────────────────────────────────────────────────────
  const inventoryData = [
    { productId: products[0].id, warehouseId: wh1.id, quantity: 250, reservedQuantity: 10 },
    { productId: products[0].id, warehouseId: wh2.id, quantity: 120, reservedQuantity: 5 },
    { productId: products[1].id, warehouseId: wh1.id, quantity: 500, reservedQuantity: 0 },
    { productId: products[1].id, warehouseId: wh3.id, quantity: 300, reservedQuantity: 20 },
    { productId: products[2].id, warehouseId: wh1.id, quantity: 80, reservedQuantity: 0 },
    { productId: products[2].id, warehouseId: wh2.id, quantity: 45, reservedQuantity: 5 },
    { productId: products[3].id, warehouseId: wh1.id, quantity: 200, reservedQuantity: 0 },
    { productId: products[3].id, warehouseId: wh2.id, quantity: 10, reservedQuantity: 0 }, // low stock
    { productId: products[4].id, warehouseId: wh1.id, quantity: 150, reservedQuantity: 0 },
    { productId: products[5].id, warehouseId: wh2.id, quantity: 60, reservedQuantity: 0 },
    { productId: products[5].id, warehouseId: wh3.id, quantity: 20, reservedQuantity: 0 }, // low stock
    { productId: products[6].id, warehouseId: wh1.id, quantity: 35, reservedQuantity: 0 },
    { productId: products[7].id, warehouseId: wh1.id, quantity: 400, reservedQuantity: 0 },
    { productId: products[7].id, warehouseId: wh2.id, quantity: 200, reservedQuantity: 0 },
  ];

  for (const inv of inventoryData) {
    await prisma.inventory.create({ data: inv });
  }

  // ── Stock Movements (initial receipt) ──────────────────────────────────
  for (const inv of inventoryData) {
    await prisma.stockMovement.create({
      data: {
        productId: inv.productId,
        warehouseId: inv.warehouseId,
        movementType: "purchase",
        quantity: inv.quantity,
        referenceType: "initial_stock",
        notes: "Initial stock seed",
        createdBy: admin.id
      }
    });
  }

  // ── Sample Purchase Order ──────────────────────────────────────────────
  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-2026-00001",
      supplierId: supplier1.id,
      warehouseId: wh1.id,
      status: "confirmed",
      totalAmount: 150000,
      notes: "Monthly electronics restock",
      createdBy: manager.id,
      items: {
        create: [
          { productId: products[0].id, quantityOrdered: 100, unitCost: 1200 },
          { productId: products[1].id, quantityOrdered: 200, unitCost: 150 }
        ]
      }
    }
  });

  // ── Sample Sales Order ─────────────────────────────────────────────────
  await prisma.salesOrder.create({
    data: {
      soNumber: "SO-2026-00001",
      customerName: "Raj Electronics",
      customerEmail: "orders@rajelectronics.in",
      warehouseId: wh1.id,
      status: "confirmed",
      totalAmount: 24990,
      notes: "Bulk order for retail",
      createdBy: staff.id,
      items: {
        create: [
          { productId: products[0].id, quantity: 10, unitPrice: 2499 }
        ]
      }
    }
  });

  // ── Sample Transfer ────────────────────────────────────────────────────
  await prisma.transfer.create({
    data: {
      transferNumber: "TR-2026-00001",
      fromWarehouseId: wh1.id,
      toWarehouseId: wh2.id,
      status: "draft",
      initiatedBy: manager.id,
      notes: "Restock Delhi center",
      items: {
        create: [
          { productId: products[0].id, quantityRequested: 50 },
          { productId: products[1].id, quantityRequested: 100 }
        ]
      }
    }
  });

  // ── Settings ───────────────────────────────────────────────────────────
  const settingsData = [
    { key: "company_name", value: JSON.stringify("Smart Inventory Inc."), description: "Company display name" },
    { key: "currency", value: JSON.stringify("INR"), description: "Default currency" },
    { key: "low_stock_threshold", value: JSON.stringify(10), description: "Global low stock threshold" },
    { key: "timezone", value: JSON.stringify("Asia/Kolkata"), description: "Default timezone" }
  ];
  for (const s of settingsData) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  console.log("✅ Seed complete!");
  console.log(`   Users: 4 (admin@demo.com, manager@demo.com, staff@demo.com, viewer@demo.com)`);
  console.log(`   Password: Inventory123`);
  console.log(`   Warehouses: 3`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Inventory records: ${inventoryData.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
