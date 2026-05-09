import { apiClient } from "@/lib/api/client";

export const dashboardApi = {
  stats: () => apiClient.get<any>("/api/dashboard/stats"),
  activity: () => apiClient.get<any[]>("/api/activity")
};
