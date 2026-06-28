import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { notFoundHandler } from "./middlewares/notFoundHandler";

export function createApp() {
  const app = express();

  app.disable("x-powered-by"); // não revela o stack
  app.use(helmet()); // headers de segurança (nosniff, frameguard, etc.)
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" })); // limita payload (anti-DoS)
  app.use(cookieParser(env.COOKIE_SECRET));

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
