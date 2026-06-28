import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        tenantId: string;
        roleId: string | null;
      };
      tenantId?: string;
      permissions?: {
        all?: boolean;
        perms?: Record<string, boolean>;
      };
    }
  }
}

export {};
