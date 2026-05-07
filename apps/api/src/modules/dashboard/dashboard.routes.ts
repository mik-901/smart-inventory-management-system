import { Router } from "express";

import { demoStore } from "../../data/demo-store.js";
import { requirePermission } from "../../middleware/rbac.js";
import { pool, query } from "../../db/pool.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", requirePermission("dashboard:read"), async (_req, res) => {
  if (pool) {
    try {
      const [productsCount] = await query("SELECT COUNT(*) as count FROM products");
      const [stockVal] = await query(`
        SELECT COALESCE(SUM(i.quantity * p.cost_price), 0) as total
        FROM inventory i
        JOIN products p ON i.product_id = p.id
      `);
      const [lowStock] = await query(`
        SELECT COUNT(*) as count FROM (
          SELECT p.id 
          FROM products p 
          LEFT JOIN inventory i ON p.id = i.product_id 
          GROUP BY p.id, p.reorder_level 
          HAVING COALESCE(SUM(i.quantity), 0) <= p.reorder_level
        ) sub
      `);
      const [ordersToday] = await query("SELECT COUNT(*) as count FROM orders WHERE created_at >= CURRENT_DATE");
      const [revenue] = await query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE type = 'SALE'");

      const stockTrend = [
        { date: "Apr 26", inward: 1280, outward: 940, stock: 18400 },
        { date: "Apr 27", inward: 1120, outward: 1020, stock: 18500 },
        { date: "Apr 28", inward: 1480, outward: 1180, stock: 18800 },
        { date: "Apr 29", inward: 980, outward: 1220, stock: 18560 },
        { date: "Apr 30", inward: 1670, outward: 1300, stock: 18930 },
        { date: "May 01", inward: 1390, outward: 980, stock: 19340 },
        { date: "May 02", inward: 1520, outward: 1100, stock: 19760 }
      ];

      return res.json({
        data: {
          totalProducts: parseInt(String(productsCount?.count || "0")),
          totalStockValue: parseFloat(String(stockVal?.total || "0")),
          lowStockItems: parseInt(String(lowStock?.count || "0")),
          ordersToday: parseInt(String(ordersToday?.count || "0")),
          revenue: parseFloat(String(revenue?.total || "0")),
          stockTrend
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to load dashboard data" });
    }
  }

  res.json({
    data: {
      ...demoStore.dashboard,
      stockTrend: [
        { date: "Apr 26", inward: 1280, outward: 940, stock: 18400 },
        { date: "Apr 27", inward: 1120, outward: 1020, stock: 18500 },
        { date: "Apr 28", inward: 1480, outward: 1180, stock: 18800 },
        { date: "Apr 29", inward: 980, outward: 1220, stock: 18560 },
        { date: "Apr 30", inward: 1670, outward: 1300, stock: 18930 },
        { date: "May 01", inward: 1390, outward: 980, stock: 19340 },
        { date: "May 02", inward: 1520, outward: 1100, stock: 19760 }
      ]
    }
  });
});
