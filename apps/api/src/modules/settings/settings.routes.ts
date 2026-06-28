import { Router } from "express";
import type { Request, Response } from "express";
import { settingsUpdateSchema } from "@glowbook/shared";
import { prisma } from "../../database/prisma";
import { validateRequest } from "../../middlewares/validateRequest";
import { requirePermission } from "../../middlewares/requirePermission";
import { asyncHandler } from "../../utils/asyncHandler";

export const settingsRoutes = Router();

async function getOrCreate(tenantId: string) {
  const existing = await prisma.tenantSetting.findUnique({ where: { tenantId } });
  if (existing) return existing;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  return prisma.tenantSetting.create({
    data: { tenantId, brandName: tenant?.name ?? "Glowbook", theme: tenant?.defaultTheme ?? "rose" },
  });
}

settingsRoutes.get(
  "/",
  requirePermission("settings.view"),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await getOrCreate(req.tenantId!));
  }),
);

settingsRoutes.patch(
  "/",
  requirePermission("settings.manage"),
  validateRequest(settingsUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await getOrCreate(req.tenantId!);
    const updated = await prisma.tenantSetting.update({
      where: { tenantId: req.tenantId! },
      data: req.body,
    });
    res.json(updated);
  }),
);
