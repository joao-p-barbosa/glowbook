import type { Request, Response } from "express";
import { professionalsService } from "./professionals.service";

export const professionalsController = {
  async list(req: Request, res: Response) {
    res.json(await professionalsService.list(req.tenantId!));
  },
  async get(req: Request, res: Response) {
    res.json(await professionalsService.get(req.tenantId!, req.params.id));
  },
  async create(req: Request, res: Response) {
    res.status(201).json(await professionalsService.create(req.tenantId!, req.body));
  },
  async update(req: Request, res: Response) {
    res.json(await professionalsService.update(req.tenantId!, req.params.id, req.body));
  },
  async remove(req: Request, res: Response) {
    await professionalsService.remove(req.tenantId!, req.params.id);
    res.status(204).send();
  },
};
