"use client";

import { productsApi } from "@/lib/api/products";
import { useApiMutation, useApiQuery } from "@/hooks/useApiResource";
import type { Product } from "@/types";

export function useProducts(query?: Record<string, string | number | boolean | null | undefined>) {
  return useApiQuery(() => productsApi.list(query), [JSON.stringify(query ?? {})], { initialData: [] as Product[] });
}

export function useProduct(id: string) {
  return useApiQuery(() => productsApi.detail(id), [id], { initialData: null as Product | null });
}

export function useCreateProduct(refetch?: () => Promise<unknown>) {
  return useApiMutation((body: Partial<Product>) => productsApi.create(body), { successMessage: "Product created", onSuccess: refetch });
}

export function useUpdateProduct(refetch?: () => Promise<unknown>) {
  return useApiMutation((id: string, body: Partial<Product>) => productsApi.update(id, body), { successMessage: "Product updated", onSuccess: refetch });
}

export function useDeleteProduct(refetch?: () => Promise<unknown>) {
  return useApiMutation((id: string) => productsApi.delete(id), { successMessage: "Product removed", onSuccess: refetch });
}

export function useAdjustProductStock(refetch?: () => Promise<unknown>) {
  return useApiMutation((id: string, body: { warehouseId?: string; warehouse?: string; quantity: number; type: string; reason: string }) => productsApi.adjustStock(id, body), {
    successMessage: "Stock adjusted",
    onSuccess: refetch
  });
}
