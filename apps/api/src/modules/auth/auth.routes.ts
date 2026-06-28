import { Router } from "express";
import { loginSchema, registerSchema } from "@glowbook/shared";
import { authController } from "./auth.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { rateLimit } from "../../middlewares/rateLimit";
import { asyncHandler } from "../../utils/asyncHandler";

export const authRoutes = Router();

const authLimiter = rateLimit({ points: 10, duration: 60, keyPrefix: "rl:auth" });

authRoutes.post("/register", authLimiter, validateRequest(registerSchema), asyncHandler(authController.register));
authRoutes.post("/login", authLimiter, validateRequest(loginSchema), asyncHandler(authController.login));
authRoutes.post("/refresh", asyncHandler(authController.refresh));
authRoutes.post("/logout", asyncHandler(authController.logout));
authRoutes.get("/me", authMiddleware, asyncHandler(authController.me));
