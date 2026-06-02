import { Router } from "express";

import { prisma } from "../../db/prisma.js";
import { requirePermission } from "../../middleware/rbac.js";
import { asyncHandler, ok } from "../../utils/http.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/stats",
  requirePermission("dashboard:read"),
  asyncHandler(async (_req, res) => {
    const [
      totalProducts,
      totalWarehouses,
      inventoryAgg,
      lowStockProducts,
      ordersToday,
      revenueResult,
      recentMovements
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.warehouse.count({ where: { isActive: true } }),
      prisma.inventory.aggregate({ _sum: { quantity: true, reservedQuantity: true } }),
      // Low stock: products where total available <= reorderPoint
      prisma.$queryRawUnsafe<{ count: number }[]>(
        `SELECT COUNT(*) as count FROM (
          SELECT p.id, p.reorder_point, COALESCE(SUM(i.quantity - i.reserved_quantity), 0) as available
          FROM products p
          LEFT JOIN inventory i ON i.product_id = p.id
          WHERE p.is_active = 1
          GROUP BY p.id
          HAVING available <= p.reorder_point
        )`
      ),
      // Orders today
      prisma.$queryRawUnsafe<{ count: number }[]>(
        `SELECT (
          (SELECT COUNT(*) FROM purchase_orders WHERE date(order_date) = date('now')) +
          (SELECT COUNT(*) FROM sales_orders WHERE date(order_date) = date('now'))
        ) as count`
      ),
      // Revenue today
      prisma.$queryRawUnsafe<{ total: number }[]>(
        `SELECT COALESCE(SUM(total_amount), 0) as total FROM sales_orders
         WHERE status IN ('confirmed', 'shipped', 'delivered') AND date(order_date) = date('now')`
      ),
      prisma.stockMovement.findMany({
        take: 15,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { name: true, sku: true } },
          warehouse: { select: { name: true } },
          creator: { select: { name: true } }
        }
      })
    ]);

    const totalQty = inventoryAgg._sum.quantity ?? 0;
    const totalReserved = inventoryAgg._sum.reservedQuantity ?? 0;

    // Get total stock value
    const stockValue = await prisma.$queryRawUnsafe<{ total: number }[]>(
      `SELECT COALESCE(SUM(i.quantity * p.cost_price), 0) as total
       FROM inventory i JOIN products p ON p.id = i.product_id`
    );

    // Top warehouses by utilization
    const warehouseStats = await prisma.$queryRawUnsafe<any[]>(
      `SELECT w.id, w.name, w.capacity,
              COALESCE(SUM(i.quantity), 0) as total_stock,
              COUNT(DISTINCT i.product_id) as product_count
       FROM warehouses w
       LEFT JOIN inventory i ON i.warehouse_id = w.id
       WHERE w.is_active = 1
       GROUP BY w.id
       ORDER BY total_stock DESC`
    );

    // Stock trend (last 7 days of movements)
    const stockTrend = await prisma.$queryRawUnsafe<any[]>(
      `SELECT date(created_at) as date, movement_type, SUM(quantity) as total
       FROM stock_movements
       WHERE created_at >= datetime('now', '-7 days')
       GROUP BY date(created_at), movement_type
       ORDER BY date ASC`
    );

    return ok(res, {
      totalProducts,
      totalWarehouses,
      totalStock: totalQty,
      totalReserved,
      totalAvailable: totalQty - totalReserved,
      totalStockValue: Number(stockValue[0]?.total ?? 0),
      lowStockItems: Number(lowStockProducts[0]?.count ?? 0),
      lowStockCount: Number(lowStockProducts[0]?.count ?? 0),
      ordersToday: Number(ordersToday[0]?.count ?? 0),
      revenue: Number(revenueResult[0]?.total ?? 0),
      revenueToday: Number(revenueResult[0]?.total ?? 0),
      recentMovements: recentMovements.map((m) => ({
        id: m.id,
        movementType: m.movementType,
        quantity: m.quantity,
        productName: m.product.name,
        productSku: m.product.sku,
        warehouse: m.warehouse.name,
        createdBy: m.creator?.name ?? "System",
        createdAt: m.createdAt
      })),
      warehouseStats: warehouseStats.map((w) => ({
        id: w.id,
        name: w.name,
        capacity: Number(w.capacity),
        totalStock: Number(w.total_stock),
        productCount: Number(w.product_count),
        utilization: w.capacity > 0 ? Math.round((Number(w.total_stock) / w.capacity) * 100) : 0
      })),
      stockTrend
    });
  })
);

dashboardRouter.get(
  "/low-stock",
  requirePermission("dashboard:read"),
  asyncHandler(async (_req, res) => {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT p.id, p.sku, p.name, p.reorder_point,
              COALESCE(SUM(i.quantity - i.reserved_quantity), 0) as available_quantity
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE p.is_active = 1
       GROUP BY p.id
       HAVING available_quantity <= p.reorder_point
       ORDER BY available_quantity ASC`
    );
    return ok(res, rows);
  })
);
