import { apiClient } from "@/lib/api/client";

export const salesOrdersApi = {
  list: (query?: Record<string, string | number | boolean | null | undefined>) => apiClient.get<any[]>("/api/sales-orders", query),
  detail: (id: string) => apiClient.get(`/api/sales-orders/${id}`),
  create: (body: unknown) => apiClient.post("/api/sales-orders", body),
  updateStatus: (id: string, status: string, extra?: Record<string, unknown>) => apiClient.patch(`/api/sales-orders/${id}/status`, { status, ...extra }),
  ship: (id: string, body: { trackingNumber?: string; carrierName?: string }) => apiClient.patch(`/api/sales-orders/${id}/ship`, body)
};
