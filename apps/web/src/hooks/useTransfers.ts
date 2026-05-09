"use client";

import { transfersApi } from "@/lib/api/transfers";
import { useApiMutation, useApiQuery } from "@/hooks/useApiResource";

export function useTransfers(query?: Record<string, string | number | boolean | null | undefined>) {
  return useApiQuery(() => transfersApi.list(query), [JSON.stringify(query ?? {})], { initialData: [] });
}

export function useTransfer(id: string) {
  return useApiQuery(() => transfersApi.detail(id), [id], { initialData: null });
}

export function useCreateTransfer(refetch?: () => Promise<unknown>) {
  return useApiMutation((body: unknown) => transfersApi.create(body), { successMessage: "Transfer created", onSuccess: refetch });
}

export function useUpdateTransferStatus(refetch?: () => Promise<unknown>) {
  return useApiMutation((id: string, status: string) => transfersApi.updateStatus(id, status), { successMessage: "Transfer updated", onSuccess: refetch });
}
