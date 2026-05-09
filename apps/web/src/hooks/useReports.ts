"use client";

import { reportsApi } from "@/lib/api/reports";
import { useApiQuery } from "@/hooks/useApiResource";

export function useReports() {
  return useApiQuery<any[]>(() => reportsApi.list(), [], { initialData: [] });
}

export function useStockValuation() {
  return useApiQuery<any[]>(() => reportsApi.stockValuation() as Promise<any[]>, [], { initialData: [] });
}

export function useReorderSuggestions() {
  return useApiQuery<any[]>(() => reportsApi.reorderSuggestions() as Promise<any[]>, [], { initialData: [] });
}
