import { prisma } from "../../database/prisma";
import { AppError } from "../../utils/AppError";
import type { ProfessionalCreateInput } from "@glowbook/shared";

export const professionalsService = {
  list(tenantId: string) {
    return prisma.professional.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: "asc" },
      include: {
        professionalServices: { include: { service: true } },
        workingHours: true,
      },
    });
  },

  async get(tenantId: string, id: string) {
    const professional = await prisma.professional.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        professionalServices: { include: { service: true } },
        workingHours: true,
      },
    });
    if (!professional) throw AppError.notFound("Profissional não encontrado");
    return professional;
  },

  async create(tenantId: string, data: ProfessionalCreateInput) {
    const { serviceIds, ...rest } = data;
    return prisma.professional.create({
      data: {
        ...rest,
        tenantId,
        professionalServices: serviceIds?.length
          ? { create: serviceIds.map((serviceId) => ({ tenantId, serviceId })) }
          : undefined,
      },
      include: { professionalServices: { include: { service: true } } },
    });
  },

  async update(tenantId: string, id: string, data: Partial<ProfessionalCreateInput>) {
    await this.get(tenantId, id);
    const { serviceIds, ...rest } = data;

    if (serviceIds) {
      // resincroniza vínculos profissional ↔ serviço
      await prisma.professionalService.deleteMany({ where: { professionalId: id } });
      await prisma.professionalService.createMany({
        data: serviceIds.map((serviceId) => ({ tenantId, professionalId: id, serviceId })),
      });
    }

    return prisma.professional.update({
      where: { id },
      data: rest,
      include: { professionalServices: { include: { service: true } } },
    });
  },

  async remove(tenantId: string, id: string) {
    await this.get(tenantId, id);
    return prisma.professional.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
