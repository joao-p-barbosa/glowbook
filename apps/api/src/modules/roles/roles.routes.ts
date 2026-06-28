import { Router } from "express";
import { roleCreateSchema, roleUpdateSchema } from "@glowbook/shared";
import { rolesController } from "./roles.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { requirePermission } from "../../middlewares/requirePermission";
import { asyncHandler } from "../../utils/asyncHandler";

export const rolesRoutes = Router();

rolesRoutes.get("/", requirePermission("roles.view"), asyncHandler(rolesController.list));
rolesRoutes.post(
  "/",
  requirePermission("roles.manage"),
  validateRequest(roleCreateSchema),
  asyncHandler(rolesController.create),
);
rolesRoutes.patch(
  "/:id",
  requirePermission("roles.manage"),
  validateRequest(roleUpdateSchema),
  asyncHandler(rolesController.update),
);
rolesRoutes.delete("/:id", requirePermission("roles.manage"), asyncHandler(rolesController.remove));
