import { Router } from "express";

import { requireAdmin } from "../../middleware/rbac.js";
import { asyncHandler, ok } from "../../utils/http.js";

export const integrationsRouter = Router();

// Mock integrations response (no DB changes needed for this stub)
integrationsRouter.get(
  "/",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    return ok(res, [
      { id: "shopify", name: "Shopify", status: "disconnected", type: "ecommerce" },
      { id: "quickbooks", name: "QuickBooks", status: "disconnected", type: "accounting" },
      { id: "stripe", name: "Stripe", status: "disconnected", type: "payment" },
      { id: "shipstation", name: "ShipStation", status: "disconnected", type: "shipping" }
    ]);
  })
);
