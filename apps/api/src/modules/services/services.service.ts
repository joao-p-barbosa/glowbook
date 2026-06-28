import { prisma } from "../../database/prisma";
import { AppError } from "../../utils/AppError";
import type { ServiceCreateInput } from "@glowbook/shared";

export const servicesService = {
  list(tenantId: string) {
    return prisma.service.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: "asc" },
      include: { category: true },
    });
  },

  async get(tenantId: string, id: string) {
    const service = await prisma.service.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { category: true },
    });
    if (!service) throw AppError.notFound("Serviço não encontrado");
    return service;
  },

  create(tenantId: string, data: ServiceCreateInput) {
    return prisma.service.create({ data: { ...data, tenantId } });
  },

  async update(tenantId: string, id: string, data: Partial<ServiceCreateInput>) {
    await this.get(tenantId, id);
    return prisma.service.update({ where: { id }, data });
  },

  async remove(tenantId: string, id: string) {
    await this.get(tenantId, id);
    return prisma.service.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
