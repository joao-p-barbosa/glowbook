import { Router } from "express";
import { categoryCreateSchema, categoryUpdateSchema } from "@glowbook/shared";
import { categoriesController } from "./categories.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { requirePermission } from "../../middlewares/requirePermission";
import { asyncHandler } from "../../utils/asyncHandler";

export const categoriesRoutes = Router();

categoriesRoutes.get("/", requirePermission("categories.view"), asyncHandler(categoriesController.list));
categoriesRoutes.post(
  "/",
  requirePermission("categories.manage"),
  validateRequest(categoryCreateSchema),
  asyncHandler(categoriesController.create),
);
categoriesRoutes.patch(
  "/:id",
  requirePermission("categories.manage"),
  validateRequest(categoryUpdateSchema),
  asyncHandler(categoriesController.update),
);
categoriesRoutes.delete("/:id", requirePermission("categories.manage"), asyncHandler(categoriesController.remove));
