import { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { AppError } from "../../utils/AppError";
import { isAdminPermissions, parsePermissions } from "../../utils/permissions";
import { del } from "../../lib/cache";
import { rolePermKey } from "../../middlewares/requirePermission";
import type { RoleCreateInput, RoleUpdateInput } from "@glowbook/shared";

function serializePermissions(data: RoleCreateInput["permissions"] | RoleUpdateInput["permissions"]) {
  return JSON.stringify(data ?? { perms: {} });
}

async function assertKeepsAdmin(tenantId: string, roleId: string, nextPermissionsJson?: string) {
  const role = await prisma.role.findFirst({ where: { id: roleId, tenantId } });
  if (!role) throw AppError.notFound("Papel nao encontrado");
  if (!isAdminPermissions(role.permissionsJson)) return;
  if (nextPermissionsJson && isAdminPermissions(nextPermissionsJson)) return;

  const activeUsers = await prisma.user.findMany({
    where: { tenantId, deletedAt: null, status: "active" },
    include: { role: true },
  });
  const activeAdmins = activeUsers.filter((u) => isAdminPermissions(u.role?.permissionsJson));
  const usersInRole = activeUsers.filter((u) => u.roleId === roleId);
  if (activeAdmins.length <= usersInRole.length) {
    throw AppError.badRequest("Nao e possivel remover o ultimo papel admin ativo");
  }
}

export const rolesService = {
  list(tenantId: string) {
    return prisma.role.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      include: { _count: { select: { users: true } } },
    }).then((roles) => roles.map((role) => ({ ...role, permissions: parsePermissions(role.permissionsJson) })));
  },

  async get(tenantId: string, id: string) {
    const role = await prisma.role.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw AppError.notFound("Papel nao encontrado");
    return { ...role, permissions: parsePermissions(role.permissionsJson) };
  },

  async create(tenantId: string, data: RoleCreateInput) {
    try {
      const role = await prisma.role.create({
        data: {
          tenantId,
          name: data.name,
          description: data.description ?? null,
          permissionsJson: serializePermissions(data.permissions),
        },
      });
      return this.get(tenantId, role.id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw AppError.conflict("Ja existe um papel com esse nome");
      }
      throw err;
    }
  },

  async update(tenantId: string, id: string, data: RoleUpdateInput) {
    await this.get(tenantId, id);
    const nextPermissionsJson = data.permissions ? serializePermissions(data.permissions) : undefined;
    if (nextPermissionsJson) await assertKeepsAdmin(tenantId, id, nextPermissionsJson);

    try {
      const role = await prisma.role.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          permissionsJson: nextPermissionsJson,
        },
      });
      await del(rolePermKey(tenantId, id));
      return this.get(tenantId, role.id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw AppError.conflict("Ja existe um papel com esse nome");
      }
      throw err;
    }
  },

  async remove(tenantId: string, id: string) {
    await assertKeepsAdmin(tenantId, id);
    const users = await prisma.user.count({ where: { tenantId, roleId: id, deletedAt: null } });
    if (users > 0) throw AppError.badRequest("Nao e possivel excluir um papel em uso");
    await prisma.role.delete({ where: { id } });
    await del(rolePermKey(tenantId, id));
  },
};
