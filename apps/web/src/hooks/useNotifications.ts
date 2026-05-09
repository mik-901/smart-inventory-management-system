"use client";

import { notificationsApi } from "@/lib/api/notifications";
import { useApiMutation, useApiQuery } from "@/hooks/useApiResource";
import type { NotificationItem } from "@/types";

export function useNotifications() {
  return useApiQuery(() => notificationsApi.list(), [], { initialData: [] as NotificationItem[], intervalMs: 30_000 });
}

export function useMarkNotificationRead(refetch?: () => Promise<unknown>) {
  return useApiMutation((id: string) => notificationsApi.markRead(id), { onSuccess: refetch });
}

export function useMarkAllNotificationsRead(refetch?: () => Promise<unknown>) {
  return useApiMutation(() => notificationsApi.markAllRead(), { successMessage: "Notifications marked read", onSuccess: refetch });
}
