import type { Request, Response } from "express";
import { rolesService } from "./roles.service";

export const rolesController = {
  async list(req: Request, res: Response) {
    res.json(await rolesService.list(req.tenantId!));
  },
  async create(req: Request, res: Response) {
    res.status(201).json(await rolesService.create(req.tenantId!, req.body));
  },
  async update(req: Request, res: Response) {
    res.json(await rolesService.update(req.tenantId!, req.params.id, req.body));
  },
  async remove(req: Request, res: Response) {
    await rolesService.remove(req.tenantId!, req.params.id);
    res.status(204).send();
  },
};
