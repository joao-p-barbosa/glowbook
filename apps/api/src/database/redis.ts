import Redis, { type RedisOptions } from "ioredis";
import { env } from "../config/env";

/**
 * Cliente Redis com degradação graciosa.
 * - REDIS_MODE=off  → nunca conecta; helpers viram no-op.
 * - REDIS_MODE=auto → conecta; se indisponível, comandos falham rápido
 *   (enableOfflineQueue:false) e o chamador cai no fallback.
 */

const enabled = env.REDIS_MODE !== "off";

let ready = false;
let loggedDown = false;

const baseOptions: RedisOptions = {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 2,
  retryStrategy: (times) => Math.min(times * 300, 3000),
};

export const redis: Redis | null = enabled ? new Redis(env.REDIS_URL, baseOptions) : null;

if (redis) {
  redis.on("ready", () => {
    ready = true;
    loggedDown = false;
    console.log("🟥 Redis conectado");
  });
  redis.on("end", () => {
    ready = false;
  });
  redis.on("error", (err: Error & { code?: string }) => {
    ready = false;
    if (!loggedDown) {
      loggedDown = true;
      console.warn(`⚠️  Redis indisponível (${err.code ?? err.message}) — seguindo sem cache/fila`);
    }
  });
  // dispara a conexão sem travar o boot
  redis.connect().catch(() => {
    /* erro já tratado no handler 'error' */
  });
}

export function isRedisReady(): boolean {
  return ready;
}

/**
 * Opções de conexão para BullMQ. Retorna um objeto (não uma instância ioredis)
 * para evitar o conflito de tipos com o ioredis empacotado dentro do BullMQ.
 * BullMQ exige maxRetriesPerRequest:null.
 */
export function bullConnectionOptions() {
  const u = new URL(env.REDIS_URL);
  return {
    host: u.hostname,
    port: Number(u.port || 6379),
    password: u.password || undefined,
    maxRetriesPerRequest: null as null,
    enableReadyCheck: false,
  };
}

export async function closeRedis(): Promise<void> {
  if (redis) await redis.quit().catch(() => undefined);
}
