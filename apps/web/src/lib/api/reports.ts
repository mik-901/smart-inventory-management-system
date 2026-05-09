import { apiClient, reportExportUrl } from "@/lib/api/client";

export const reportsApi = {
  list: () => apiClient.get<any[]>("/api/reports"),
  stockValuation: () => apiClient.get("/api/reports/stock-valuation"),
  movementHistory: (query?: Record<string, string | number>) => apiClient.get("/api/reports/movement-history", query),
  abcAnalysis: () => apiClient.get("/api/reports/abc-analysis"),
  deadStock: (days = 90) => apiClient.get("/api/reports/dead-stock", { days }),
  aging: () => apiClient.get("/api/reports/aging"),
  reorderSuggestions: () => apiClient.get("/api/reports/reorder-suggestions"),
  exportUrl: reportExportUrl
};
