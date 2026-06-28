import type { Request, Response } from "express";
import { appointmentsService } from "./appointments.service";

export const appointmentsController = {
  async list(req: Request, res: Response) {
    res.json(await appointmentsService.list(req.tenantId!, req.query as never));
  },
  async get(req: Request, res: Response) {
    res.json(await appointmentsService.get(req.tenantId!, req.params.id));
  },
  async create(req: Request, res: Response) {
    res.status(201).json(await appointmentsService.create(req.tenantId!, req.body));
  },
  async update(req: Request, res: Response) {
    res.json(await appointmentsService.update(req.tenantId!, req.params.id, req.body));
  },
  async remove(req: Request, res: Response) {
    res.json(await appointmentsService.cancel(req.tenantId!, req.params.id));
  },
};
