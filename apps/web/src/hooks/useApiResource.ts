"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";

export function useApiQuery<T>(fetcher: () => Promise<T>, deps: unknown[] = [], options: { intervalMs?: number; initialData: T }) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["api", fetcher.toString(), ...deps], deps);
  const query = useQuery({
    queryKey,
    queryFn: fetcher,
    refetchInterval: options.intervalMs,
    initialData: options.initialData
  });

  useEffect(() => {
    if (query.error instanceof Error) toast.error(query.error.message);
  }, [query.error]);

  return {
    data: (query.data ?? options.initialData) as T,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
    refetch: async () => (await query.refetch()).data ?? options.initialData,
    setData: (updater: T | ((current: T) => T)) => queryClient.setQueryData(queryKey, updater)
  };
}

export function useApiMutation<TArgs extends unknown[], TResult>(
  mutateFn: (...args: TArgs) => Promise<TResult>,
  options: { successMessage?: string; onSuccess?: (result: TResult) => unknown | Promise<unknown> } = {}
) {
  const mutation = useMutation({
    mutationFn: (args: TArgs) => mutateFn(...args),
    onSuccess: async (result) => {
      if (options.successMessage) toast.success(options.successMessage);
      await options.onSuccess?.(result);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Request failed");
    }
  });

  return {
    mutate: (...args: TArgs) => mutation.mutateAsync(args),
    isLoading: mutation.isPending
  };
}
