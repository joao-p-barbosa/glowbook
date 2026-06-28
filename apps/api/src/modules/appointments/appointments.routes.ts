import { Router } from "express";
import {
  appointmentCreateSchema,
  appointmentUpdateSchema,
  appointmentQuerySchema,
} from "@glowbook/shared";
import { appointmentsController } from "./appointments.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { requirePermission } from "../../middlewares/requirePermission";
import { asyncHandler } from "../../utils/asyncHandler";

export const appointmentsRoutes = Router();

appointmentsRoutes.get("/", requirePermission("appointments.view"), validateRequest(appointmentQuerySchema, "query"), asyncHandler(appointmentsController.list));
appointmentsRoutes.post("/", requirePermission("appointments.manage"), validateRequest(appointmentCreateSchema), asyncHandler(appointmentsController.create));
appointmentsRoutes.get("/:id", requirePermission("appointments.view"), asyncHandler(appointmentsController.get));
appointmentsRoutes.patch("/:id", requirePermission("appointments.manage"), validateRequest(appointmentUpdateSchema), asyncHandler(appointmentsController.update));
appointmentsRoutes.delete("/:id", requirePermission("appointments.manage"), asyncHandler(appointmentsController.remove));
