import type { PoolClient } from "pg";
import type { Server } from "socket.io";

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

export async function adjustInventory(client: PoolClient, input: AdjustmentInput) {
  const quantityDelta = Number(input.quantityDelta ?? 0);
  const reservedDelta = Number(input.reservedDelta ?? 0);

  await client.query(
    `insert into inventory (product_id, warehouse_id, quantity, reserved_quantity, batch_number)
     values ($1, $2, 0, 0, '')
     on conflict (product_id, warehouse_id, batch_number) do nothing`,
    [input.productId, input.warehouseId]
  );

  const updated = await client.query(
    `update inventory
       set quantity = quantity + $3::int,
           reserved_quantity = reserved_quantity + $4::int,
           updated_at = now()
     where product_id = $1
       and warehouse_id = $2
       and batch_number = ''
       and quantity + $3::int >= 0
       and reserved_quantity + $4::int >= 0
       and reserved_quantity + $4::int <= quantity + $3::int
     returning id, product_id, warehouse_id, quantity, reserved_quantity, available_quantity`,
    [input.productId, input.warehouseId, quantityDelta, reservedDelta]
  );

  if (updated.rowCount !== 1) {
    throw new Error("Insufficient available stock for this operation");
  }

  if (input.movementType && input.movementQuantity && input.movementQuantity > 0) {
    await client.query(
      `insert into stock_movements (
         product_id, warehouse_id, movement_type, quantity, reference_id, reference_type,
         unit_cost, total_cost, notes, created_by
       )
       values ($1, $2, $3, $4, $5, $6, $7, case when $7::numeric is null then null else $4 * $7::numeric end, $8, $9)`,
      [
        input.productId,
        input.warehouseId,
        input.movementType,
        input.movementQuantity,
        input.referenceId ?? null,
        input.referenceType ?? null,
        input.unitCost ?? null,
        input.notes ?? null,
        input.userId ?? null
      ]
    );
  }

  await checkLowStock(client, input.productId, input.io);
  input.io?.emit("inventory:updated", updated.rows[0]);
  return updated.rows[0];
}

export async function checkLowStock(client: PoolClient, productId: string, io?: Server) {
  const result = await client.query(
    `select
       p.id,
       p.name,
       p.sku,
       p.reorder_point,
       coalesce(sum(i.available_quantity), 0)::int as available_quantity
     from products p
     left join inventory i on i.product_id = p.id
     where p.id = $1 and p.is_active = true
     group by p.id`,
    [productId]
  );

  const product = result.rows[0];
  if (!product || Number(product.available_quantity) > Number(product.reorder_point)) return;

  const users = await client.query("select id from users where role in ('admin', 'manager') and is_active = true");
  for (const user of users.rows) {
    await client.query(
      `insert into notifications (user_id, type, title, message, entity_type, entity_id)
       values ($1, 'low_stock', 'Low stock warning', $2, 'products', $3)`,
      [
        user.id,
        `${product.name} (${product.sku}) is below reorder point. Available: ${product.available_quantity}, reorder point: ${product.reorder_point}.`,
        product.id
      ]
    );
  }

  io?.emit("notification:low_stock", {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    availableQuantity: Number(product.available_quantity),
    reorderPoint: Number(product.reorder_point)
  });
}
