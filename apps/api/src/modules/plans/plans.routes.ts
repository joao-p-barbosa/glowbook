import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../../database/prisma";
import { asyncHandler } from "../../utils/asyncHandler";

export const plansRoutes = Router();

plansRoutes.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
    res.json(plans);
  }),
);
