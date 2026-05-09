import { apiClient } from "@/lib/api/client";
import type { InventoryItem } from "@/types";

export const inventoryApi = {
  list: (query?: Record<string, string | number | boolean | null | undefined>) => apiClient.get<InventoryItem[]>("/api/inventory", query),
  lowStock: () => apiClient.get("/api/inventory/low-stock"),
  expiring: (days = 30) => apiClient.get("/api/inventory/expiring", { days }),
  valuation: () => apiClient.get("/api/inventory/valuation"),
  movements: (query?: Record<string, string | number>) => apiClient.get("/api/inventory/movements", query),
  adjust: (body: { productId?: string; sku?: string; warehouseId?: string; warehouse?: string; quantity: number; type: string; reason: string }) =>
    apiClient.post("/api/inventory/adjust", body)
};
