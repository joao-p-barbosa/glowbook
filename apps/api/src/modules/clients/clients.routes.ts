import { Router } from "express";
import { clientCreateSchema, clientUpdateSchema } from "@glowbook/shared";
import { clientsController } from "./clients.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { requirePermission } from "../../middlewares/requirePermission";
import { asyncHandler } from "../../utils/asyncHandler";

export const clientsRoutes = Router();

clientsRoutes.get("/", requirePermission("clients.view"), asyncHandler(clientsController.list));
clientsRoutes.post("/", requirePermission("clients.manage"), validateRequest(clientCreateSchema), asyncHandler(clientsController.create));
clientsRoutes.get("/:id", requirePermission("clients.view"), asyncHandler(clientsController.get));
clientsRoutes.patch("/:id", requirePermission("clients.manage"), validateRequest(clientUpdateSchema), asyncHandler(clientsController.update));
clientsRoutes.delete("/:id", requirePermission("clients.manage"), asyncHandler(clientsController.remove));
