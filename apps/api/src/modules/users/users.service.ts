import { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { AppError } from "../../utils/AppError";
import { hashPassword } from "../../utils/password";
import { isAdminPermissions } from "../../utils/permissions";
import type { UserCreateInput, UserUpdateInput } from "@glowbook/shared";

function publicSelect() {
  return {
    id: true,
    name: true,
    email: true,
    status: true,
    roleId: true,
    createdAt: true,
    updatedAt: true,
    lastLoginAt: true,
    role: { select: { id: true, name: true, permissionsJson: true } },
    professional: { select: { id: true, name: true } },
  } satisfies Prisma.UserSelect;
}

async function assertRole(tenantId: string, roleId: string | null | undefined) {
  if (!roleId) return;
  const role = await prisma.role.findFirst({ where: { id: roleId, tenantId } });
  if (!role) throw AppError.badRequest("Papel invalido");
}

async function assertProfessional(tenantId: string, professionalId: string | null | undefined, userId?: string) {
  if (!professionalId) return;
  const professional = await prisma.professional.findFirst({
    where: { id: professionalId, tenantId, deletedAt: null },
  });
  if (!professional) throw AppError.badRequest("Profissional invalido");
  if (professional.userId && professional.userId !== userId) {
    throw AppError.conflict("Profissional ja vinculado a outro usuario");
  }
}

async function assertNotLastActiveAdmin(tenantId: string, userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId, deletedAt: null },
    include: { role: true },
  });
  if (!user) throw AppError.notFound("Usuario nao encontrado");
  if (!isAdminPermissions(user.role?.permissionsJson)) return;

  const activeUsers = await prisma.user.findMany({
    where: { tenantId, deletedAt: null, status: "active" },
    include: { role: true },
  });
  const activeAdmins = activeUsers.filter((u) => isAdminPermissions(u.role?.permissionsJson));
  if (activeAdmins.length <= 1 && activeAdmins[0]?.id === userId) {
    throw AppError.badRequest("Nao e possivel remover ou inativar o ultimo admin ativo");
  }
}

async function syncProfessionalLink(tenantId: string, userId: string, professionalId: string | null | undefined) {
  if (professionalId === undefined) return;
  await prisma.professional.updateMany({ where: { tenantId, userId }, data: { userId: null } });
  if (professionalId) {
    await prisma.professional.update({ where: { id: professionalId }, data: { userId } });
  }
}

export const usersService = {
  list(tenantId: string) {
    return prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: "asc" },
      select: publicSelect(),
    });
  },

  async get(tenantId: string, id: string) {
    const user = await prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: publicSelect(),
    });
    if (!user) throw AppError.notFound("Usuario nao encontrado");
    return user;
  },

  async create(tenantId: string, data: UserCreateInput) {
    const email = data.email.trim().toLowerCase();
    await assertRole(tenantId, data.roleId);
    await assertProfessional(tenantId, data.professionalId);

    try {
      const user = await prisma.user.create({
        data: {
          tenantId,
          name: data.name,
          email,
          roleId: data.roleId || null,
          status: data.status,
          passwordHash: await hashPassword(data.password),
        },
        select: publicSelect(),
      });
      await syncProfessionalLink(tenantId, user.id, data.professionalId ?? null);
      return this.get(tenantId, user.id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw AppError.conflict("Ja existe um usuario com esse e-mail");
      }
      throw err;
    }
  },

  async update(tenantId: string, id: string, data: UserUpdateInput) {
    await this.get(tenantId, id);
    await assertRole(tenantId, data.roleId);
    await assertProfessional(tenantId, data.professionalId, id);

    if (data.status === "inactive") await assertNotLastActiveAdmin(tenantId, id);

    const updateData: Prisma.UserUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email.trim().toLowerCase();
    if (data.roleId !== undefined) updateData.role = data.roleId ? { connect: { id: data.roleId } } : { disconnect: true };
    if (data.status !== undefined) updateData.status = data.status;
    if (data.password) updateData.passwordHash = await hashPassword(data.password);

    try {
      await prisma.user.update({ where: { id }, data: updateData });
      await syncProfessionalLink(tenantId, id, data.professionalId);
      return this.get(tenantId, id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw AppError.conflict("Ja existe um usuario com esse e-mail");
      }
      throw err;
    }
  },

  async remove(tenantId: string, id: string, currentUserId: string) {
    if (id === currentUserId) throw AppError.badRequest("Voce nao pode excluir seu proprio usuario");
    await assertNotLastActiveAdmin(tenantId, id);
    await this.get(tenantId, id);
    await prisma.$transaction([
      prisma.professional.updateMany({ where: { tenantId, userId: id }, data: { userId: null } }),
      prisma.user.update({ where: { id }, data: { deletedAt: new Date(), status: "inactive" } }),
    ]);
  },
};
