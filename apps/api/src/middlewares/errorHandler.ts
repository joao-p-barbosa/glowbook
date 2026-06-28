import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { isProd } from "../config/env";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Erros de validação Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Dados inválidos", details: err.flatten() },
    });
  }

  // Erros conhecidos da aplicação
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // Erros do Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res
        .status(409)
        .json({ error: { code: "CONFLICT", message: "Registro duplicado" } });
    }
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Recurso não encontrado" } });
    }
  }

  // Fallback — não vaza stack em produção
  console.error("[errorHandler]", err);
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Erro interno do servidor",
      ...(isProd ? {} : { details: err instanceof Error ? err.message : String(err) }),
    },
  });
}
