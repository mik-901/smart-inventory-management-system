"use client";

import { purchaseOrdersApi } from "@/lib/api/purchaseOrders";
import { useApiMutation, useApiQuery } from "@/hooks/useApiResource";

export function usePurchaseOrders(query?: Record<string, string | number | boolean | null | undefined>) {
  return useApiQuery(() => purchaseOrdersApi.list(query), [JSON.stringify(query ?? {})], { initialData: [] });
}

export function usePurchaseOrder(id: string) {
  return useApiQuery(() => purchaseOrdersApi.detail(id), [id], { initialData: null });
}

export function useCreatePurchaseOrder(refetch?: () => Promise<unknown>) {
  return useApiMutation((body: unknown) => purchaseOrdersApi.create(body), { successMessage: "Purchase order created", onSuccess: refetch });
}

export function useReceivePurchaseOrder(refetch?: () => Promise<unknown>) {
  return useApiMutation((id: string, items: unknown[]) => purchaseOrdersApi.receive(id, items), { successMessage: "Purchase order received", onSuccess: refetch });
}
