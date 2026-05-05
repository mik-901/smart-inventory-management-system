import { createServer } from "node:http";

import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { createRealtimeServer } from "./realtime/socket.js";

const app = createApp();
const server = createServer(app);
const io = createRealtimeServer(server);

app.set("io", io);

server.listen(env.PORT, () => {
  console.log(`Smart Inventory API listening on http://localhost:${env.PORT}`);
});
