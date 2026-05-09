import { apiClient } from "@/lib/api/client";

export const transfersApi = {
  list: (query?: Record<string, string | number | boolean | null | undefined>) => apiClient.get<any[]>("/api/transfers", query),
  detail: (id: string) => apiClient.get(`/api/transfers/${id}`),
  create: (body: unknown) => apiClient.post("/api/transfers", body),
  updateStatus: (id: string, status: string) => apiClient.patch(`/api/transfers/${id}/status`, { status })
};
