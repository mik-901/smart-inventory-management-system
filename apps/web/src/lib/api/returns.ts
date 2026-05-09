import { apiClient } from "@/lib/api/client";

export const returnsApi = {
  list: (query?: Record<string, string | number | boolean | null | undefined>) => apiClient.get<any[]>("/api/returns", query),
  detail: (id: string) => apiClient.get(`/api/returns/${id}`),
  create: (body: unknown) => apiClient.post("/api/returns", body),
  approve: (id: string) => apiClient.patch(`/api/returns/${id}/approve`),
  reject: (id: string) => apiClient.patch(`/api/returns/${id}/reject`)
};
