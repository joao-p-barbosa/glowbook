export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, code = "APP_ERROR", details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(msg: string, details?: unknown) {
    return new AppError(400, msg, "BAD_REQUEST", details);
  }
  static unauthorized(msg = "Não autenticado") {
    return new AppError(401, msg, "UNAUTHORIZED");
  }
  static forbidden(msg = "Acesso negado") {
    return new AppError(403, msg, "FORBIDDEN");
  }
  static notFound(msg = "Recurso não encontrado") {
    return new AppError(404, msg, "NOT_FOUND");
  }
  static conflict(msg: string) {
    return new AppError(409, msg, "CONFLICT");
  }
}
