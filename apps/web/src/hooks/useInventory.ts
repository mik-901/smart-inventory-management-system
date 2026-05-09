"use client";

import { inventoryApi } from "@/lib/api/inventory";
import { useApiMutation, useApiQuery } from "@/hooks/useApiResource";
import type { InventoryItem } from "@/types";

export function useInventory(query?: Record<string, string | number | boolean | null | undefined>) {
  return useApiQuery(() => inventoryApi.list(query), [JSON.stringify(query ?? {})], { initialData: [] as InventoryItem[] });
}

export function useLowStock() {
  return useApiQuery(() => inventoryApi.lowStock(), [], { initialData: [] });
}

export function useInventoryValuation() {
  return useApiQuery(() => inventoryApi.valuation(), [], { initialData: [] });
}

export function useAdjustInventory(refetch?: () => Promise<unknown>) {
  return useApiMutation((body: { productId?: string; sku?: string; warehouseId?: string; warehouse?: string; quantity: number; type: string; reason: string }) => inventoryApi.adjust(body), {
    successMessage: "Inventory adjusted",
    onSuccess: refetch
  });
}
