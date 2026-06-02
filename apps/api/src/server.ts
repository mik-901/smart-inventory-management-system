import { createServer } from "node:http";

import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { createRealtimeServer } from "./realtime/socket.js";

const app = createApp();
const server = createServer(app);
const io = createRealtimeServer(server);

app.set("io", io);

server.listen(env.PORT, () => {
  console.log(`\nSmart Inventory API -> http://localhost:${env.PORT}\n`);
});
