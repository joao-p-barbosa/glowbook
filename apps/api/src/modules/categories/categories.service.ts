import { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { AppError } from "../../utils/AppError";
import type { CategoryCreateInput } from "@glowbook/shared";

export const categoriesService = {
  list(tenantId: string) {
    return prisma.serviceCategory.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      include: { _count: { select: { services: true } } },
    });
  },

  async get(tenantId: string, id: string) {
    const category = await prisma.serviceCategory.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { services: true } } },
    });
    if (!category) throw AppError.notFound("Categoria nao encontrada");
    return category;
  },

  async create(tenantId: string, data: CategoryCreateInput) {
    try {
      return await prisma.serviceCategory.create({ data: { ...data, tenantId } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw AppError.conflict("Ja existe uma categoria com esse nome");
      }
      throw err;
    }
  },

  async update(tenantId: string, id: string, data: Partial<CategoryCreateInput>) {
    await this.get(tenantId, id);
    try {
      return await prisma.serviceCategory.update({ where: { id }, data });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw AppError.conflict("Ja existe uma categoria com esse nome");
      }
      throw err;
    }
  },

  async remove(tenantId: string, id: string) {
    await this.get(tenantId, id);
    await prisma.$transaction([
      prisma.service.updateMany({ where: { tenantId, categoryId: id }, data: { categoryId: null } }),
      prisma.serviceCategory.delete({ where: { id } }),
    ]);
  },
};
