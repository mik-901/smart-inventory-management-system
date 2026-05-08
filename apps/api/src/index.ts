import { createServer } from "node:http";

import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { createRealtimeServer } from "./realtime/socket.js";
import { testConnection } from "./db/pool.js";

const app = createApp();
const server = createServer(app);
const io = createRealtimeServer(server);

app.set("io", io);

server.listen(env.PORT, async () => {
  console.log(`\n🚀 Smart Inventory API  →  http://localhost:${env.PORT}\n`);
  await testConnection();
  console.log("");
});
