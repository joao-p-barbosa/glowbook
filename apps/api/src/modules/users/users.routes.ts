import { Router } from "express";
import { userCreateSchema, userUpdateSchema } from "@glowbook/shared";
import { usersController } from "./users.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { requirePermission } from "../../middlewares/requirePermission";
import { asyncHandler } from "../../utils/asyncHandler";

export const usersRoutes = Router();

usersRoutes.get("/", requirePermission("users.view"), asyncHandler(usersController.list));
usersRoutes.post(
  "/",
  requirePermission("users.manage"),
  validateRequest(userCreateSchema),
  asyncHandler(usersController.create),
);
usersRoutes.patch(
  "/:id",
  requirePermission("users.manage"),
  validateRequest(userUpdateSchema),
  asyncHandler(usersController.update),
);
usersRoutes.delete("/:id", requirePermission("users.manage"), asyncHandler(usersController.remove));
