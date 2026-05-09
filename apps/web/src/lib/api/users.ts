import { apiClient } from "@/lib/api/client";
import type { AppUser } from "@/types";

export const usersApi = {
  list: (query?: Record<string, string | number | boolean | null | undefined>) => apiClient.get<AppUser[]>("/api/users", query),
  detail: (id: string) => apiClient.get<AppUser>(`/api/users/${id}`),
  create: (body: Partial<AppUser> & { password: string }) => apiClient.post<AppUser>("/api/users", body),
  update: (id: string, body: Partial<AppUser>) => apiClient.put<AppUser>(`/api/users/${id}`, body),
  updatePassword: (id: string, password: string) => apiClient.patch(`/api/users/${id}/password`, { password }),
  delete: (id: string) => apiClient.delete(`/api/users/${id}`)
};
