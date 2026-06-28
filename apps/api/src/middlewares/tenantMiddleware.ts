import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

/**
 * Deriva o tenant do usuário autenticado e injeta req.tenantId.
 * O frontend NUNCA envia tenant_id — a separação é responsabilidade do backend.
 */
export function tenantMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.tenantId) {
    throw AppError.forbidden("Tenant não identificado para o usuário");
  }
  req.tenantId = req.user.tenantId;
  next();
}
