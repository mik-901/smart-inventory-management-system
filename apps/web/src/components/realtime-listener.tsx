"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function RealtimeListener() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    const refresh = () => void queryClient.invalidateQueries({ queryKey: ["api"] });

    socket.on("notification:low_stock", (event: { name?: string; sku?: string }) => {
      toast.warning(`Low stock: ${event.name ?? event.sku ?? "product"}`);
      refresh();
    });
    socket.on("order:new", refresh);
    socket.on("order:updated", refresh);
    socket.on("transfer:updated", refresh);
    socket.on("inventory:updated", refresh);

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  return null;
}
