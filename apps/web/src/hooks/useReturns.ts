"use client";

import { returnsApi } from "@/lib/api/returns";
import { useApiMutation, useApiQuery } from "@/hooks/useApiResource";

export function useReturns(query?: Record<string, string | number | boolean | null | undefined>) {
  return useApiQuery(() => returnsApi.list(query), [JSON.stringify(query ?? {})], { initialData: [] });
}

export function useReturn(id: string) {
  return useApiQuery(() => returnsApi.detail(id), [id], { initialData: null });
}

export function useCreateReturn(refetch?: () => Promise<unknown>) {
  return useApiMutation((body: unknown) => returnsApi.create(body), { successMessage: "Return created", onSuccess: refetch });
}

export function useApproveReturn(refetch?: () => Promise<unknown>) {
  return useApiMutation((id: string) => returnsApi.approve(id), { successMessage: "Return approved", onSuccess: refetch });
}

export function useRejectReturn(refetch?: () => Promise<unknown>) {
  return useApiMutation((id: string) => returnsApi.reject(id), { successMessage: "Return rejected", onSuccess: refetch });
}
