"use client";

import { dashboardApi } from "@/lib/api/dashboard";
import { useApiQuery } from "@/hooks/useApiResource";

export function useDashboard() {
  return useApiQuery(() => dashboardApi.stats(), [], { initialData: {}, intervalMs: 60_000 });
}

export function useActivity() {
  return useApiQuery(() => dashboardApi.activity(), [], { initialData: [], intervalMs: 60_000 });
}
