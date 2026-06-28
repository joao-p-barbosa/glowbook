import type { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

type Target = "body" | "query" | "params";

/**
 * Valida e substitui req[target] pelos dados parseados (com coerções do Zod).
 */
export function validateRequest(schema: ZodSchema, target: Target = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return next(result.error);
    }
    // sobrescreve com dados parseados/coeridos
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}
