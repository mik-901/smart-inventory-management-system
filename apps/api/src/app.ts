import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { pool } from "./db/pool.js";
import { authenticate } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error.js";
import { activityRouter } from "./modules/activity/activity.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { inventoryRouter } from "./modules/inventory/inventory.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";
import { ordersRouter } from "./modules/orders/orders.routes.js";
import { productsRouter } from "./modules/products/products.routes.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";
import { returnsRouter } from "./modules/returns/returns.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { warehousesRouter } from "./modules/warehouses/warehouses.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/health", async (_req, res) => {
    const database = pool ? "configured" : "demo-store";
    res.json({
      status: "ok",
      service: "smart-inventory-api",
      database,
      timestamp: new Date().toISOString()
    });
  });

  app.use("/auth", authRouter);
  app.use("/api", authenticate);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/inventory", inventoryRouter);
  app.use("/api/warehouses", warehousesRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/returns", returnsRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/activity", activityRouter);
  app.use("/api/notifications", notificationsRouter);

  app.use(errorHandler);

  return app;
}
