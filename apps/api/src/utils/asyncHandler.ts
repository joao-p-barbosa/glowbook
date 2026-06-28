import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Envolve handlers async para encaminhar erros ao errorHandler do Express 4.
 */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
