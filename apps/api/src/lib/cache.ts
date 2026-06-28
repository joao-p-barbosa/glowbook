import { redis, isRedisReady } from "../database/redis";

/**
 * Helpers de cache com fallback. Se o Redis estiver fora, tudo vira no-op
 * (getJson → null, setJson/del → ignorado, wrap → executa a fn direto).
 * Chaves devem ser namespaced por tenant (ex.: `perm:{tenantId}:{roleId}`).
 */

export async function getJson<T>(key: string): Promise<T | null> {
  if (!redis || !isRedisReady()) return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!redis || !isRedisReady()) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    /* ignora — cache é best-effort */
  }
}

export async function del(...keys: string[]): Promise<void> {
  if (!redis || !isRedisReady() || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch {
    /* ignora */
  }
}

/** Remove todas as chaves que casam com o padrão (ex.: `perm:{tenantId}:*`). */
export async function delPattern(pattern: string): Promise<void> {
  if (!redis || !isRedisReady()) return;
  try {
    const stream = redis.scanStream({ match: pattern, count: 100 });
    const pipeline = redis.pipeline();
    let found = false;
    for await (const keys of stream as AsyncIterable<string[]>) {
      for (const k of keys) {
        pipeline.del(k);
        found = true;
      }
    }
    if (found) await pipeline.exec();
  } catch {
    /* ignora */
  }
}

/** Lê do cache; em miss, executa fn, grava e retorna. Sem Redis, só executa fn. */
export async function wrap<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const cached = await getJson<T>(key);
  if (cached !== null) return cached;
  const fresh = await fn();
  if (fresh !== null && fresh !== undefined) await setJson(key, fresh, ttlSeconds);
  return fresh;
}
