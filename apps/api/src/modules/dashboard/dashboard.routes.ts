import { Router } from "express";

import { demoStore } from "../../data/demo-store.js";
import { requirePermission } from "../../middleware/rbac.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", requirePermission("dashboard:read"), (_req, res) => {
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
