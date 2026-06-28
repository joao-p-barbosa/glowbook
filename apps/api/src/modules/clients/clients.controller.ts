import type { Request, Response } from "express";
import { clientsService } from "./clients.service";

export const clientsController = {
  async list(req: Request, res: Response) {
    res.json(await clientsService.list(req.tenantId!));
  },
  async get(req: Request, res: Response) {
    res.json(await clientsService.get(req.tenantId!, req.params.id));
  },
  async create(req: Request, res: Response) {
    res.status(201).json(await clientsService.create(req.tenantId!, req.body));
  },
  async update(req: Request, res: Response) {
    res.json(await clientsService.update(req.tenantId!, req.params.id, req.body));
  },
  async remove(req: Request, res: Response) {
    await clientsService.remove(req.tenantId!, req.params.id);
    res.status(204).send();
  },
};
