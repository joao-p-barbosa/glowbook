import { Router } from "express";
import type { Request, Response } from "express";
import { tenantUpdateSchema, planChangeSchema } from "@glowbook/shared";
import { prisma } from "../../database/prisma";
import { AppError } from "../../utils/AppError";
import { validateRequest } from "../../middlewares/validateRequest";
import { requirePermission } from "../../middlewares/requirePermission";
import { asyncHandler } from "../../utils/asyncHandler";

export const tenantsRoutes = Router();

tenantsRoutes.get(
  "/current",
  requirePermission("settings.view"),
  asyncHandler(async (req: Request, res: Response) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId! },
      include: { plan: true },
    });
    if (!tenant) throw AppError.notFound("Empresa não encontrada");
    res.json(tenant);
  }),
);

tenantsRoutes.patch(
  "/current/plan",
  requirePermission("settings.manage"),
  validateRequest(planChangeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const plan = await prisma.plan.findUnique({ where: { key: req.body.planKey } });
    if (!plan) throw AppError.notFound("Plano não encontrado");
    const tenant = await prisma.tenant.update({
      where: { id: req.tenantId! },
      data: { planId: plan.id, planStatus: "active" },
      include: { plan: true },
    });
    res.json(tenant);
  }),
);

tenantsRoutes.patch(
  "/current",
  requirePermission("settings.manage"),
  validateRequest(tenantUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const tenant = await prisma.tenant.update({ where: { id: req.tenantId! }, data: req.body });
    res.json(tenant);
  }),
);
