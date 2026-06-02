import type { PrismaClient, Prisma } from "@prisma/client";
import type { Server } from "socket.io";

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

type AdjustmentInput = {
  productId: string;
  warehouseId: string;
  quantityDelta?: number;
  reservedDelta?: number;
  movementType?: "purchase" | "sale" | "transfer_in" | "transfer_out" | "adjustment" | "return" | "damage";
  movementQuantity?: number;
  referenceId?: string | null;
  referenceType?: string | null;
  unitCost?: number | null;
  notes?: string | null;
  userId?: string | null;
  io?: Server;
};

export async function adjustInventory(tx: TxClient, input: AdjustmentInput) {
  const quantityDelta = input.quantityDelta ?? 0;
  const reservedDelta = input.reservedDelta ?? 0;

  // Upsert the inventory record (ensure it exists)
  await tx.inventory.upsert({
    where: {
      productId_warehouseId_batchNumber: {
        productId: input.productId,
        warehouseId: input.warehouseId,
        batchNumber: ""
      }
    },
    create: {
      productId: input.productId,
      warehouseId: input.warehouseId,
      quantity: 0,
      reservedQuantity: 0,
      batchNumber: ""
    },
    update: {
      updatedAt: new Date()
    }
  });

  // Fetch current state for validation
  const current = await tx.inventory.findUnique({
    where: {
      productId_warehouseId_batchNumber: {
        productId: input.productId,
        warehouseId: input.warehouseId,
        batchNumber: ""
      }
    }
  });

  if (!current) throw new Error("Inventory record not found after upsert");

  const newQuantity = current.quantity + quantityDelta;
  const newReserved = current.reservedQuantity + reservedDelta;
  const newAvailable = newQuantity - newReserved;

  if (newQuantity < 0) throw new Error("Insufficient stock for this operation");
  if (newReserved < 0) throw new Error("Reserved quantity cannot be negative");
  if (newReserved > newQuantity) throw new Error("Reserved quantity exceeds total stock");

  const updated = await tx.inventory.update({
    where: { id: current.id },
    data: {
      quantity: newQuantity,
      reservedQuantity: newReserved
    }
  });

  // Record stock movement
  if (input.movementType && input.movementQuantity && input.movementQuantity > 0) {
    await tx.stockMovement.create({
      data: {
        productId: input.productId,
        warehouseId: input.warehouseId,
        movementType: input.movementType,
        quantity: input.movementQuantity,
        referenceId: input.referenceId ?? null,
        referenceType: input.referenceType ?? null,
        unitCost: input.unitCost ?? null,
        totalCost: input.unitCost != null ? input.movementQuantity * input.unitCost : null,
        notes: input.notes ?? null,
        createdBy: input.userId ?? null
      }
    });
  }

  // Check low stock
  await checkLowStock(tx, input.productId, input.io);

  const result = {
    id: updated.id,
    product_id: updated.productId,
    warehouse_id: updated.warehouseId,
    quantity: updated.quantity,
    reserved_quantity: updated.reservedQuantity,
    available_quantity: updated.quantity - updated.reservedQuantity
  };

  input.io?.emit("inventory:updated", result);
  return result;
}

export async function checkLowStock(tx: TxClient, productId: string, io?: Server) {
  const product = await tx.product.findUnique({
    where: { id: productId, isActive: true },
    select: { id: true, name: true, sku: true, reorderPoint: true }
  });

  if (!product) return;

  const inventoryAgg = await tx.inventory.aggregate({
    where: { productId },
    _sum: { quantity: true, reservedQuantity: true }
  });

  const totalQty = inventoryAgg._sum.quantity ?? 0;
  const totalReserved = inventoryAgg._sum.reservedQuantity ?? 0;
  const available = totalQty - totalReserved;

  if (available > product.reorderPoint) return;

  // Create notifications for admin/manager users
  const users = await tx.user.findMany({
    where: { role: { in: ["admin", "manager"] }, isActive: true },
    select: { id: true }
  });

  for (const user of users) {
    await tx.notification.create({
      data: {
        userId: user.id,
        type: "low_stock",
        title: "Low stock warning",
        message: `${product.name} (${product.sku}) is below reorder point. Available: ${available}, reorder point: ${product.reorderPoint}.`,
        entityType: "products",
        entityId: product.id
      }
    });
  }

  io?.emit("notification:low_stock", {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    availableQuantity: available,
    reorderPoint: product.reorderPoint
  });
}
