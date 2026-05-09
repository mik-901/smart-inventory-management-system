"use client";

import { salesOrdersApi } from "@/lib/api/salesOrders";
import { useApiMutation, useApiQuery } from "@/hooks/useApiResource";

export function useSalesOrders(query?: Record<string, string | number | boolean | null | undefined>) {
  return useApiQuery(() => salesOrdersApi.list(query), [JSON.stringify(query ?? {})], { initialData: [] });
}

export function useSalesOrder(id: string) {
  return useApiQuery(() => salesOrdersApi.detail(id), [id], { initialData: null });
}

export function useCreateSalesOrder(refetch?: () => Promise<unknown>) {
  return useApiMutation((body: unknown) => salesOrdersApi.create(body), { successMessage: "Sales order created", onSuccess: refetch });
}

export function useUpdateSalesOrderStatus(refetch?: () => Promise<unknown>) {
  return useApiMutation((id: string, status: string, extra?: Record<string, unknown>) => salesOrdersApi.updateStatus(id, status, extra), {
    successMessage: "Sales order updated",
    onSuccess: refetch
  });
}
