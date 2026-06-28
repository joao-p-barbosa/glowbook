import type { Request, Response } from "express";
import { servicesService } from "./services.service";

export const servicesController = {
  async list(req: Request, res: Response) {
    res.json(await servicesService.list(req.tenantId!));
  },
  async get(req: Request, res: Response) {
    res.json(await servicesService.get(req.tenantId!, req.params.id));
  },
  async create(req: Request, res: Response) {
    res.status(201).json(await servicesService.create(req.tenantId!, req.body));
  },
  async update(req: Request, res: Response) {
    res.json(await servicesService.update(req.tenantId!, req.params.id, req.body));
  },
  async remove(req: Request, res: Response) {
    await servicesService.remove(req.tenantId!, req.params.id);
    res.status(204).send();
  },
};
