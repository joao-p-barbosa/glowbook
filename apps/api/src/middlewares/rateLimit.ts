import type { Request, Response, NextFunction } from "express";
import { RateLimiterRedis, RateLimiterMemory, type RateLimiterAbstract } from "rate-limiter-flexible";
import { redis } from "../database/redis";
import { AppError } from "../utils/AppError";

interface Options {
  points: number; // tentativas permitidas
  duration: number; // janela em segundos
  keyPrefix: string;
}

/**
 * Rate limit por IP. Usa Redis quando disponível; cai para memória local
 * (insuranceLimiter) se o Redis estiver fora — assim nunca derruba a rota.
 */
export function rateLimit({ points, duration, keyPrefix }: Options) {
  const memory = new RateLimiterMemory({ points, duration });
  const limiter: RateLimiterAbstract = redis
    ? new RateLimiterRedis({ storeClient: redis, points, duration, keyPrefix, insuranceLimiter: memory })
    : memory;

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? "unknown";
    try {
      await limiter.consume(key);
      next();
    } catch (rej) {
      const retry = Math.ceil((((rej as { msBeforeNext?: number }).msBeforeNext ?? duration * 1000)) / 1000);
      res.setHeader("Retry-After", String(retry));
      next(new AppError(429, "Muitas tentativas. Tente novamente em instantes.", "RATE_LIMITED"));
    }
  };
}
