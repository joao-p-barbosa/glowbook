import { prisma } from "../../database/prisma";
import { AppError } from "../../utils/AppError";
import { verifyPassword, hashPassword } from "../../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { parsePermissions } from "../../utils/permissions";
import { redis, isRedisReady } from "../../database/redis";
import type { RegisterInput } from "@glowbook/shared";

const SESSION_TTL_SEC = 7 * 24 * 60 * 60;
const sessKey = (refreshToken: string) => `sess:${refreshToken}`;

async function storeSession(refreshToken: string, userId: string) {
  if (redis && isRedisReady()) {
    await redis.set(sessKey(refreshToken), userId, "EX", SESSION_TTL_SEC).catch(() => undefined);
  }
}

function slugify(input: string): string {
  return (
    input
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "estudio"
  );
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 1;
  while (await prisma.tenant.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

function publicUser(u: {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  roleId: string | null;
  tenantId: string;
  role?: { id: string; name: string; permissionsJson: string } | null;
  tenant?: { id: string; name: string; slug: string; defaultTheme: string; timezone: string } | null;
}) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    roleId: u.roleId,
    tenantId: u.tenantId,
    permissions: parsePermissions(u.role?.permissionsJson),
    role: u.role ? { id: u.role.id, name: u.role.name } : null,
    tenant: u.tenant
      ? {
          id: u.tenant.id,
          name: u.tenant.name,
          slug: u.tenant.slug,
          defaultTheme: u.tenant.defaultTheme,
          timezone: u.tenant.timezone,
        }
      : undefined,
  };
}

export const authService = {
  async register(data: RegisterInput) {
    const slug = await uniqueSlug(slugify(data.studioName));
    const passwordHash = await hashPassword(data.password);

    const { user } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.studioName,
          slug,
          status: "active",
          planStatus: "trial",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          settings: { create: { brandName: data.studioName, theme: "rose" } },
        },
      });

      const role = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: "Admin",
          description: "Acesso total",
          permissionsJson: JSON.stringify({ all: true }),
        },
      });

      const existing = await tx.user.findFirst({
        where: { tenantId: tenant.id, email: data.email },
      });
      if (existing) throw AppError.conflict("E-mail já cadastrado");

      const created = await tx.user.create({
        data: {
          tenantId: tenant.id,
          roleId: role.id,
          name: data.name,
          email: data.email,
          passwordHash,
          status: "active",
        },
        include: { tenant: true, role: true },
      });

      return { user: created };
    });

    const accessToken = signAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      roleId: user.roleId,
    });
    const refreshToken = signRefreshToken(user.id);
    const expiresAt = new Date(Date.now() + SESSION_TTL_SEC * 1000);
    await prisma.session.create({ data: { userId: user.id, refreshToken, expiresAt } });
    await storeSession(refreshToken, user.id);

    return { accessToken, refreshToken, user: publicUser(user) };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findFirst({
      where: { email, status: "active", deletedAt: null },
      include: { tenant: true, role: true },
    });
    if (!user) throw AppError.unauthorized("Credenciais inválidas");

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw AppError.unauthorized("Credenciais inválidas");

    if (user.tenant.status !== "active") {
      throw AppError.forbidden("Empresa inativa");
    }

    const accessToken = signAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      roleId: user.roleId,
    });
    const refreshToken = signRefreshToken(user.id);

    const expiresAt = new Date(Date.now() + SESSION_TTL_SEC * 1000);
    await prisma.session.create({
      data: { userId: user.id, refreshToken, expiresAt },
    });
    await storeSession(refreshToken, user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { accessToken, refreshToken, user: publicUser(user) };
  },

  async refresh(refreshToken: string) {
    if (!refreshToken) throw AppError.unauthorized("Refresh token ausente");

    try {
      verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized("Refresh token inválido");
    }

    // valida sessão (revogação): Redis primeiro, DB como fallback durável
    let userId: string | null = null;
    if (redis && isRedisReady()) {
      userId = await redis.get(sessKey(refreshToken)).catch(() => null);
    }
    if (!userId) {
      const session = await prisma.session.findUnique({ where: { refreshToken } });
      if (!session || session.expiresAt < new Date()) {
        throw AppError.unauthorized("Sessão expirada");
      }
      userId = session.userId;
      // re-aquece o cache de sessão
      const ttl = Math.ceil((session.expiresAt.getTime() - Date.now()) / 1000);
      if (ttl > 0) await storeSession(refreshToken, userId);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt || user.status !== "active") {
      throw AppError.unauthorized("Sessão inválida");
    }

    const accessToken = signAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      roleId: user.roleId,
    });
    return { accessToken };
  },

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    await prisma.session.deleteMany({ where: { refreshToken } });
    if (redis && isRedisReady()) await redis.del(sessKey(refreshToken)).catch(() => undefined);
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true, role: true },
    });
    if (!user) throw AppError.notFound("Usuário não encontrado");
    return {
      ...publicUser(user),
    };
  },
};
