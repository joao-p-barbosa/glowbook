import { Router } from "express";
import { serviceCreateSchema, serviceUpdateSchema } from "@glowbook/shared";
import { servicesController } from "./services.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { requirePermission } from "../../middlewares/requirePermission";
import { asyncHandler } from "../../utils/asyncHandler";

export const servicesRoutes = Router();

servicesRoutes.get("/", requirePermission("services.view"), asyncHandler(servicesController.list));
servicesRoutes.post("/", requirePermission("services.manage"), validateRequest(serviceCreateSchema), asyncHandler(servicesController.create));
servicesRoutes.get("/:id", requirePermission("services.view"), asyncHandler(servicesController.get));
servicesRoutes.patch("/:id", requirePermission("services.manage"), validateRequest(serviceUpdateSchema), asyncHandler(servicesController.update));
servicesRoutes.delete("/:id", requirePermission("services.manage"), asyncHandler(servicesController.remove));
