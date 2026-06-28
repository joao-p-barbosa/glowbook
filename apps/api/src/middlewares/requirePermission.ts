import type { NextFunction, Request, Response } from "express";
import type { PermissionKey, Permissions } from "@glowbook/shared";
import { prisma } from "../database/prisma";
import { AppError } from "../utils/AppError";
import { hasPermission, parsePermissions } from "../utils/permissions";
import { wrap } from "../lib/cache";

export const rolePermKey = (tenantId: string, roleId: string) => `perm:${tenantId}:${roleId}`;

export function requirePermission(permission: PermissionKey) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user?.roleId || !req.tenantId) {
        throw AppError.forbidden("Permissao insuficiente");
      }

      const permissions = await wrap<Permissions | null>(
        rolePermKey(req.tenantId, req.user.roleId),
        60,
        async () => {
          const role = await prisma.role.findFirst({
            where: { id: req.user!.roleId!, tenantId: req.tenantId! },
            select: { permissionsJson: true },
          });
          return role ? parsePermissions(role.permissionsJson) : null;
        },
      );
      if (!permissions) throw AppError.forbidden("Permissao insuficiente");

      req.permissions = permissions;
      if (!hasPermission(permissions, permission)) {
        throw AppError.forbidden("Permissao insuficiente");
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
