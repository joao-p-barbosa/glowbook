import type { Request, Response } from "express";
import { usersService } from "./users.service";

export const usersController = {
  async list(req: Request, res: Response) {
    res.json(await usersService.list(req.tenantId!));
  },
  async create(req: Request, res: Response) {
    res.status(201).json(await usersService.create(req.tenantId!, req.body));
  },
  async update(req: Request, res: Response) {
    res.json(await usersService.update(req.tenantId!, req.params.id, req.body));
  },
  async remove(req: Request, res: Response) {
    await usersService.remove(req.tenantId!, req.params.id, req.user!.id);
    res.status(204).send();
  },
};
