import { createApp } from "./app";
import { env } from "./config/env";
import { startRemindersWorker, closeQueues } from "./queues/reminders";
import { closeRedis } from "./database/redis";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🌸 Glowbook API rodando em http://localhost:${env.PORT}/api`);
});

// inicia o worker de lembretes (no-op se Redis desligado)
startRemindersWorker();

async function shutdown(signal: string) {
  console.log(`\n${signal} recebido — encerrando…`);
  server.close();
  await closeQueues();
  await closeRedis();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
