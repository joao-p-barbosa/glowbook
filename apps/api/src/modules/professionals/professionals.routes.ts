import { Router } from "express";
import { professionalCreateSchema, professionalUpdateSchema } from "@glowbook/shared";
import { professionalsController } from "./professionals.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { requirePermission } from "../../middlewares/requirePermission";
import { asyncHandler } from "../../utils/asyncHandler";

export const professionalsRoutes = Router();

professionalsRoutes.get("/", requirePermission("professionals.view"), asyncHandler(professionalsController.list));
professionalsRoutes.post("/", requirePermission("professionals.manage"), validateRequest(professionalCreateSchema), asyncHandler(professionalsController.create));
professionalsRoutes.get("/:id", requirePermission("professionals.view"), asyncHandler(professionalsController.get));
professionalsRoutes.patch("/:id", requirePermission("professionals.manage"), validateRequest(professionalUpdateSchema), asyncHandler(professionalsController.update));
professionalsRoutes.delete("/:id", requirePermission("professionals.manage"), asyncHandler(professionalsController.remove));
