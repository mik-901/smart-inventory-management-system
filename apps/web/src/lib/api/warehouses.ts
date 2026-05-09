import { apiClient } from "@/lib/api/client";
import type { Warehouse } from "@/types";

export const warehousesApi = {
  list: (query?: Record<string, string | number | boolean | null | undefined>) => apiClient.get<Warehouse[]>("/api/warehouses", query),
  detail: (id: string) => apiClient.get<Warehouse>(`/api/warehouses/${id}`),
  inventory: (id: string) => apiClient.get(`/api/warehouses/${id}/inventory`),
  create: (body: Partial<Warehouse> & { name: string; city: string }) => apiClient.post<Warehouse>("/api/warehouses", body),
  update: (id: string, body: Partial<Warehouse>) => apiClient.put<Warehouse>(`/api/warehouses/${id}`, body),
  delete: (id: string) => apiClient.delete(`/api/warehouses/${id}`)
};
