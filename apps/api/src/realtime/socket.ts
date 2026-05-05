import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

import { env } from "../config/env.js";

export function createRealtimeServer(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.emit("system:ready", {
      message: "Realtime inventory channel connected",
      at: new Date().toISOString()
    });

    socket.on("inventory:subscribe", (warehouseId: string) => {
      socket.join(`warehouse:${warehouseId}`);
    });
  });

  return io;
}
