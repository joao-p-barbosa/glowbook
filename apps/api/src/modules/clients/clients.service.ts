import { prisma } from "../../database/prisma";
import { AppError } from "../../utils/AppError";
import type { ClientCreateInput } from "@glowbook/shared";

export const clientsService = {
  list(tenantId: string) {
    return prisma.client.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: "asc" },
    });
  },

  async get(tenantId: string, id: string) {
    const client = await prisma.client.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        appointments: {
          orderBy: { startsAt: "desc" },
          take: 20,
          include: { service: true, professional: true },
        },
      },
    });
    if (!client) throw AppError.notFound("Cliente não encontrado");
    return client;
  },

  create(tenantId: string, data: ClientCreateInput) {
    return prisma.client.create({ data: { ...data, tenantId } });
  },

  async update(tenantId: string, id: string, data: Partial<ClientCreateInput>) {
    await this.get(tenantId, id);
    return prisma.client.update({ where: { id }, data });
  },

  async remove(tenantId: string, id: string) {
    await this.get(tenantId, id);
    return prisma.client.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
