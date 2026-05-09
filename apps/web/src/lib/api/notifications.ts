import { apiClient } from "@/lib/api/client";
import type { NotificationItem } from "@/types";

export const notificationsApi = {
  list: () => apiClient.get<NotificationItem[]>("/api/notifications"),
  markRead: (id: string) => apiClient.patch(`/api/notifications/${id}/read`),
  markAllRead: () => apiClient.patch("/api/notifications/read-all")
};
