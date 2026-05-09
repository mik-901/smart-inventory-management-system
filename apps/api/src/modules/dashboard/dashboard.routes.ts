import { Router } from "express";

import { query } from "../../db/pool.js";
import { requirePermission } from "../../middleware/rbac.js";
import { asyncHandler, ok } from "../../utils/http.js";
import { toInteger, toNumber } from "../../utils/serializers.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  ["/", "/stats"],
  requirePermission("dashboard:read"),
  asyncHandler(async (_req, res) => {
    const [counts, lowStockRows, todayRows, topMovingProducts, stockValueByWarehouse, recentMovements] = await Promise.all([
      query<{
        total_products: string;
        total_warehouses: string;
        total_stock_value: string;
      }>(
        `select
           (select count(*) from products where is_active = true) as total_products,
           (select count(*) from warehouses where is_active = true) as total_warehouses,
           (select coalesce(sum(i.quantity * p.cost_price), 0)
              from inventory i
              join products p on p.id = i.product_id
             where p.is_active = true) as total_stock_value`
      ),
      query<{ low_stock_count: string }>(
        `select count(*) as low_stock_count
           from (
             select p.id, p.reorder_point, coalesce(sum(i.available_quantity), 0) as available
             from products p
             left join inventory i on i.product_id = p.id
             where p.is_active = true
             group by p.id
             having coalesce(sum(i.available_quantity), 0) <= p.reorder_point
           ) low_stock`
      ),
      query<{ orders_today: string; revenue_today: string }>(
        `select
           (select count(*) from purchase_orders where order_date = current_date)
           + (select count(*) from sales_orders where order_date = current_date) as orders_today,
           (select coalesce(sum(total_amount), 0)
              from sales_orders
             where order_date = current_date
               and status in ('confirmed', 'shipped', 'delivered')) as revenue_today`
      ),
      query(
        `select p.id, p.sku, p.name, sum(sm.quantity)::int as quantity
           from stock_movements sm
           join products p on p.id = sm.product_id
          where sm.created_at >= now() - interval '30 days'
          group by p.id
          order by quantity desc
          limit 8`
      ),
      query(
        `select w.id, w.name, coalesce(sum(i.quantity * p.cost_price), 0) as value
           from warehouses w
           left join inventory i on i.warehouse_id = w.id
           left join products p on p.id = i.product_id
          where w.is_active = true
          group by w.id
          order by value desc`
      ),
      query(
        `select sm.id, sm.movement_type, sm.quantity, sm.reference_type, sm.reference_id, sm.created_at,
                p.sku, p.name as product_name, w.name as warehouse_name
           from stock_movements sm
           join products p on p.id = sm.product_id
           join warehouses w on w.id = sm.warehouse_id
          order by sm.created_at desc
          limit 12`
      )
    ]);

    const countRow = counts[0] ?? { total_products: "0", total_warehouses: "0", total_stock_value: "0" };
    const lowStockCount = toInteger(lowStockRows[0]?.low_stock_count);
    const today = todayRows[0] ?? { orders_today: "0", revenue_today: "0" };

    return ok(res, {
      totalProducts: toInteger(countRow.total_products),
      warehouses: toInteger(countRow.total_warehouses),
      totalWarehouses: toInteger(countRow.total_warehouses),
      lowStockCount,
      lowStockItems: lowStockCount,
      ordersToday: toInteger(today.orders_today),
      revenueToday: toNumber(today.revenue_today),
      revenue: toNumber(today.revenue_today),
      totalStockValue: toNumber(countRow.total_stock_value),
      topMovingProducts: topMovingProducts.map((row) => ({ ...row, quantity: toInteger(row.quantity) })),
      stockValueByWarehouse: stockValueByWarehouse.map((row) => ({ ...row, value: toNumber(row.value) })),
      recentMovements
    });
  })
);
