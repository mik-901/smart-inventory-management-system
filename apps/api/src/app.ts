import cors from "cors";
import express, { type Router } from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { pool } from "./db/pool.js";
import { auditMutations } from "./middleware/audit.js";
import { authenticate } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error.js";
import { activityRouter } from "./modules/activity/activity.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { categoriesRouter } from "./modules/categories/categories.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { integrationsRouter } from "./modules/integrations/integrations.routes.js";
import { inventoryRouter } from "./modules/inventory/inventory.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";
import { ordersRouter } from "./modules/orders/orders.routes.js";
import { productsRouter } from "./modules/products/products.routes.js";
import { purchaseOrdersRouter } from "./modules/purchase-orders/purchase-orders.routes.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";
import { returnsRouter } from "./modules/returns/returns.routes.js";
import { salesOrdersRouter } from "./modules/sales-orders/sales-orders.routes.js";
import { settingsRouter } from "./modules/settings/settings.routes.js";
import { suppliersRouter } from "./modules/suppliers/suppliers.routes.js";
import { transfersRouter } from "./modules/transfers/transfers.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { warehousesRouter } from "./modules/warehouses/warehouses.routes.js";

type Mount = [path: string, router: Router];

const protectedMounts: Mount[] = [
  ["/dashboard", dashboardRouter],
  ["/warehouses", warehousesRouter],
  ["/categories", categoriesRouter],
  ["/suppliers", suppliersRouter],
  ["/products", productsRouter],
  ["/inventory", inventoryRouter],
  ["/purchase-orders", purchaseOrdersRouter],
  ["/sales-orders", salesOrdersRouter],
  ["/transfers", transfersRouter],
  ["/returns", returnsRouter],
  ["/orders", ordersRouter],
  ["/reports", reportsRouter],
  ["/users", usersRouter],
  ["/activity", activityRouter],
  ["/notifications", notificationsRouter],
  ["/settings", settingsRouter],
  ["/integrations", integrationsRouter]
];

export function createApp() {
  const app = express();

  // CORS Configuration
  const corsOrigin = env.CORS_ORIGIN || "http://localhost:3000";
  const corsOrigins = corsOrigin.split(",").map(origin => origin.trim());
  
  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins.length > 1 ? corsOrigins : corsOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 86400
    })
  );
  app.use(express.json({ limit: "5mb" }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/health", (_req, res) => {
    res.json({
      success: true,
      status: "ok",
      service: "smart-inventory-api",
      database: pool ? "configured" : "missing DATABASE_URL",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  });

  app.use("/auth", authRouter);

  for (const [path, router] of protectedMounts) {
    app.use(`/api${path}`, authenticate, auditMutations, router);
  }

  app.use(errorHandler);

  return app;
}
