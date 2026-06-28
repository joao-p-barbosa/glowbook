import type { Request, Response } from "express";
import { authService } from "./auth.service";
import { env, isProd } from "../../config/env";
import { AppError } from "../../utils/AppError";

const REFRESH_COOKIE = "glowbook_rt";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export const authController = {
  async register(req: Request, res: Response) {
    const { accessToken, refreshToken, user } = await authService.register(req.body);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ accessToken, user });
  },

  async login(req: Request, res: Response) {
    const { email, password } = req.body as { email: string; password: string };
    const { accessToken, refreshToken, user } = await authService.login(email, password);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user });
  },

  async refresh(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    const { accessToken } = await authService.refresh(token);
    res.json({ accessToken });
  },

  async logout(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    await authService.logout(token);
    res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
    res.status(204).send();
  },

  async me(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const me = await authService.me(req.user.id);
    res.json(me);
  },
};

export { REFRESH_COOKIE };
