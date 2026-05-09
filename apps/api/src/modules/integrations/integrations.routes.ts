import { Router } from "express";
import { stringify } from "csv-stringify/sync";
import { z } from "zod";

import { query, queryOne, transaction } from "../../db/pool.js";
import { requireMinimumRole, requirePermission } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import { adjustInventory } from "../../services/inventory.service.js";
import type { AuthRequest } from "../../types/index.js";
import { asyncHandler, created } from "../../utils/http.js";

export const integrationsRouter = Router();

const salePayloadSchema = z.object({
  customerName: z.string().min(1).default("POS Customer"),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  warehouseId: z.string().uuid(),
  externalId: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid().optional(),
      sku: z.string().optional(),
      quantity: z.coerce.number().int().positive(),
      unitPrice: z.coerce.number().nonnegative().optional()
    })
  ).min(1)
});

function orderNumber(prefix: string) {
  return `${prefix}-${new Date().getFullYear()}-${Math.floor(Date.now() % 900000)}`;
}

async function createIntegratedSale(req: AuthRequest, payload: z.infer<typeof salePayloadSchema>, source: string) {
  return transaction(async (client) => {
    let total = 0;
    const items = [];
    for (const item of payload.items) {
      let productId = item.productId;
      if (!productId && item.sku) {
        const product = await client.query("select id, selling_price from products where sku = $1", [item.sku]);
        productId = product.rows[0]?.id;
        item.unitPrice ??= Number(product.rows[0]?.selling_price ?? 0);
      }
      if (!productId) throw new Error("Every sale item needs productId or sku");
      const product = await client.query("select selling_price from products where id = $1", [productId]);
      const unitPrice = item.unitPrice ?? Number(product.rows[0]?.selling_price ?? 0);
      total += item.quantity * unitPrice;
      items.push({ productId, quantity: item.quantity, unitPrice });
    }

    const so = await client.query(
      `insert into sales_orders (so_number, customer_name, customer_email, customer_phone, warehouse_id, status, total_amount, notes, created_by)
       values ($1, $2, $3, $4, $5, 'confirmed', $6, $7, $8)
       returning *`,
      [
        orderNumber(source === "pos" ? "POS" : "WEB"),
        payload.customerName,
        payload.customerEmail ?? null,
        payload.customerPhone ?? null,
        payload.warehouseId,
        total,
        payload.externalId ? `${source} external id: ${payload.externalId}` : `${source} integration`,
        req.user?.id ?? null
      ]
    );

    for (const item of items) {
      await client.query(
        `insert into sales_order_items (so_id, product_id, quantity, unit_price)
         values ($1, $2, $3, $4)`,
        [so.rows[0].id, item.productId, item.quantity, item.unitPrice]
      );
      await adjustInventory(client, {
        productId: item.productId,
        warehouseId: payload.warehouseId,
        quantityDelta: -item.quantity,
        movementType: "sale",
        movementQuantity: item.quantity,
        referenceId: so.rows[0].id,
        referenceType: source,
        unitCost: item.unitPrice,
        notes: `${source} sale`,
        userId: req.user?.id ?? null,
        io: req.app.get("io")
      });
    }
    return so.rows[0];
  });
}

integrationsRouter.post(
  "/pos/sale",
  requireMinimumRole("staff"),
  validateBody(salePayloadSchema),
  asyncHandler<AuthRequest>(async (req, res) => {
    const sale = await createIntegratedSale(req, req.body as z.infer<typeof salePayloadSchema>, "pos");
    req.app.get("io")?.emit("order:new", { type: "pos_sale", id: sale.id });
    return created(res, sale, "POS sale imported");
  })
);

integrationsRouter.post(
  "/webhook/order",
  requireMinimumRole("staff"),
  validateBody(salePayloadSchema),
  asyncHandler<AuthRequest>(async (req, res) => {
    const sale = await createIntegratedSale(req, req.body as z.infer<typeof salePayloadSchema>, "ecommerce");
    req.app.get("io")?.emit("order:new", { type: "ecommerce_order", id: sale.id });
    return created(res, sale, "Webhook order imported");
  })
);

integrationsRouter.get(
  "/export/accounting",
  requirePermission("reports:read"),
  asyncHandler(async (req, res) => {
    const from = req.query.from ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    const to = req.query.to ?? new Date().toISOString().slice(0, 10);
    const rows = await query(
      `select so.order_date,
              so.so_number,
              p.sku,
              p.name as product,
              soi.quantity,
              soi.total_price as sales_revenue,
              (soi.quantity * p.cost_price) as cogs,
              (soi.total_price - soi.quantity * p.cost_price) as gross_margin
         from sales_orders so
         join sales_order_items soi on soi.so_id = so.id
         join products p on p.id = soi.product_id
        where so.order_date between $1 and $2
          and so.status in ('confirmed', 'shipped', 'delivered')
        order by so.order_date, so.so_number`,
      [from, to]
    );
    const csv = stringify(rows, { header: true });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=\"accounting-export.csv\"");
    return res.send(csv);
  })
);
