import { apiClient } from "@/lib/api/client";
import type { Product } from "@/types";

export const productsApi = {
  list: (query?: Record<string, string | number | boolean | null | undefined>) => apiClient.get<Product[]>("/api/products", query),
  detail: (id: string) => apiClient.get<Product>(`/api/products/${id}`),
  stock: (id: string) => apiClient.get(`/api/products/${id}/stock`),
  movements: (id: string, query?: Record<string, string | number>) => apiClient.get(`/api/products/${id}/movements`, query),
  create: (body: Partial<Product>) => apiClient.post<Product>("/api/products", body),
  update: (id: string, body: Partial<Product>) => apiClient.put<Product>(`/api/products/${id}`, body),
  delete: (id: string) => apiClient.delete(`/api/products/${id}`),
  adjustStock: (id: string, body: { warehouseId?: string; warehouse?: string; quantity: number; type: string; reason: string }) =>
    apiClient.post(`/api/products/${id}/adjust-stock`, body)
};
