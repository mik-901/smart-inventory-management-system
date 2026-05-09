"use client";

import { usersApi } from "@/lib/api/users";
import { useApiMutation, useApiQuery } from "@/hooks/useApiResource";
import type { AppUser } from "@/types";

export function useUsers(query?: Record<string, string | number | boolean | null | undefined>) {
  return useApiQuery(() => usersApi.list(query), [JSON.stringify(query ?? {})], { initialData: [] as AppUser[] });
}

export function useUser(id: string) {
  return useApiQuery(() => usersApi.detail(id), [id], { initialData: null as AppUser | null });
}

export function useCreateUser(refetch?: () => Promise<unknown>) {
  return useApiMutation((body: Partial<AppUser> & { password: string }) => usersApi.create(body), { successMessage: "User created", onSuccess: refetch });
}

export function useUpdateUser(refetch?: () => Promise<unknown>) {
  return useApiMutation((id: string, body: Partial<AppUser>) => usersApi.update(id, body), { successMessage: "User updated", onSuccess: refetch });
}

export function useDeleteUser(refetch?: () => Promise<unknown>) {
  return useApiMutation((id: string) => usersApi.delete(id), { successMessage: "User disabled", onSuccess: refetch });
}
