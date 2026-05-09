import { apiClient } from "@/lib/api/client";

export const purchaseOrdersApi = {
  list: (query?: Record<string, string | number | boolean | null | undefined>) => apiClient.get<any[]>("/api/purchase-orders", query),
  detail: (id: string) => apiClient.get(`/api/purchase-orders/${id}`),
  create: (body: unknown) => apiClient.post("/api/purchase-orders", body),
  update: (id: string, body: unknown) => apiClient.put(`/api/purchase-orders/${id}`, body),
  updateStatus: (id: string, status: string) => apiClient.patch(`/api/purchase-orders/${id}/status`, { status }),
  receive: (id: string, items: unknown[]) => apiClient.post(`/api/purchase-orders/${id}/receive`, { items })
};
