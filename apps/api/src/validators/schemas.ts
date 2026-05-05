import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(3),
  category: z.string().min(2),
  brand: z.string().optional().default(""),
  price: z.coerce.number().nonnegative(),
  costPrice: z.coerce.number().nonnegative(),
  barcode: z.string().optional().default(""),
  variants: z.array(z.string()).default([]),
  batchNumber: z.string().optional().default(""),
  expiryDate: z.string().optional().default(""),
  reorderLevel: z.coerce.number().int().nonnegative().default(10),
  supplier: z.string().optional().default(""),
  imageUrl: z.string().url().optional().default("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800")
});

export const inventoryAdjustmentSchema = z.object({
  sku: z.string().min(3),
  warehouse: z.string().min(2),
  quantity: z.coerce.number().int().positive(),
  type: z.enum(["ADD", "REMOVE", "DAMAGED", "TRANSFER"]),
  toWarehouse: z.string().optional(),
  reason: z.string().optional()
});

export const orderSchema = z.object({
  type: z.enum(["Purchase", "Sales", "Transfer"]),
  party: z.string().min(2),
  warehouse: z.string().min(2),
  amount: z.coerce.number().nonnegative().default(0)
});

export const returnSchema = z.object({
  orderNumber: z.string().min(3),
  warehouse: z.string().min(2),
  reason: z.string().min(3),
  items: z.coerce.number().int().positive()
});

export const userRoleSchema = z.object({
  role: z.enum(["SUPER_ADMIN", "MANAGER", "WAREHOUSE_STAFF", "VIEWER"])
});
