"use client";

import { warehousesApi } from "@/lib/api/warehouses";
import { useApiMutation, useApiQuery } from "@/hooks/useApiResource";
import type { Warehouse } from "@/types";

export function useWarehouses(query?: Record<string, string | number | boolean | null | undefined>) {
  return useApiQuery(() => warehousesApi.list(query), [JSON.stringify(query ?? {})], { initialData: [] as Warehouse[] });
}

export function useWarehouse(id: string) {
  return useApiQuery(() => warehousesApi.detail(id), [id], { initialData: null as Warehouse | null });
}

export function useCreateWarehouse(refetch?: () => Promise<unknown>) {
  return useApiMutation((body: Partial<Warehouse> & { name: string; city: string }) => warehousesApi.create(body), {
    successMessage: "Warehouse created",
    onSuccess: refetch
  });
}

export function useUpdateWarehouse(refetch?: () => Promise<unknown>) {
  return useApiMutation((id: string, body: Partial<Warehouse>) => warehousesApi.update(id, body), { successMessage: "Warehouse updated", onSuccess: refetch });
}

export function useDeleteWarehouse(refetch?: () => Promise<unknown>) {
  return useApiMutation((id: string) => warehousesApi.delete(id), { successMessage: "Warehouse removed", onSuccess: refetch });
}
