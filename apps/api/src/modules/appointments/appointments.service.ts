import { prisma } from "../../database/prisma";
import { AppError } from "../../utils/AppError";
import { enqueueAppointmentReminders } from "../../queues/reminders";
import type {
  AppointmentCreateInput,
} from "@glowbook/shared";

interface ListQuery {
  from?: Date;
  to?: Date;
  professionalId?: string;
  clientId?: string;
  status?: string;
}

const fullInclude = {
  client: true,
  service: true,
  professional: true,
} as const;

async function assertNoConflict(
  tenantId: string,
  professionalId: string,
  startsAt: Date,
  endsAt: Date,
  ignoreId?: string,
) {
  const overlap = await prisma.appointment.findFirst({
    where: {
      tenantId,
      professionalId,
      id: ignoreId ? { not: ignoreId } : undefined,
      status: { notIn: ["canceled", "no_show"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });
  if (overlap) {
    throw AppError.conflict("Horário em conflito para este profissional");
  }
}

export const appointmentsService = {
  list(tenantId: string, q: ListQuery) {
    return prisma.appointment.findMany({
      where: {
        tenantId,
        professionalId: q.professionalId,
        clientId: q.clientId,
        status: q.status as never,
        startsAt: q.from || q.to ? { gte: q.from, lte: q.to } : undefined,
      },
      orderBy: { startsAt: "asc" },
      include: fullInclude,
    });
  },

  async get(tenantId: string, id: string) {
    const appt = await prisma.appointment.findFirst({
      where: { id, tenantId },
      include: fullInclude,
    });
    if (!appt) throw AppError.notFound("Agendamento não encontrado");
    return appt;
  },

  async create(tenantId: string, data: AppointmentCreateInput) {
    const service = await prisma.service.findFirst({
      where: { id: data.serviceId, tenantId, deletedAt: null },
    });
    if (!service) throw AppError.badRequest("Serviço inválido");

    // duração e preço default vêm do serviço; preço gravado preserva histórico
    const startsAt = data.startsAt;
    const endsAt =
      data.endsAt ?? new Date(startsAt.getTime() + service.durationMin * 60_000);
    const priceCents = data.priceCents ?? service.priceCents;

    if (endsAt <= startsAt) throw AppError.badRequest("Horário final deve ser após o inicial");

    await assertNoConflict(tenantId, data.professionalId, startsAt, endsAt);

    const appointment = await prisma.appointment.create({
      data: {
        tenantId,
        clientId: data.clientId,
        serviceId: data.serviceId,
        professionalId: data.professionalId,
        startsAt,
        endsAt,
        priceCents,
        notes: data.notes ?? null,
        status: data.status,
      },
      include: fullInclude,
    });

    // agenda lembretes (best-effort; sem Redis, degrada silenciosamente)
    await enqueueAppointmentReminders(appointment.id, appointment.startsAt);

    return appointment;
  },

  async update(tenantId: string, id: string, data: Record<string, unknown>) {
    const current = await this.get(tenantId, id);

    const startsAt = (data.startsAt as Date) ?? current.startsAt;
    const professionalId = (data.professionalId as string) ?? current.professionalId;
    let endsAt = (data.endsAt as Date) ?? current.endsAt;

    // se mudou o serviço e não veio endsAt explícito, recalcula a duração
    if (data.serviceId && !data.endsAt) {
      const service = await prisma.service.findFirst({
        where: { id: data.serviceId as string, tenantId, deletedAt: null },
      });
      if (!service) throw AppError.badRequest("Serviço inválido");
      endsAt = new Date(startsAt.getTime() + service.durationMin * 60_000);
    }

    if (endsAt <= startsAt) throw AppError.badRequest("Horário final deve ser após o inicial");

    if (data.status !== "canceled" && data.status !== "no_show") {
      await assertNoConflict(tenantId, professionalId, startsAt, endsAt, id);
    }

    const patch: Record<string, unknown> = { ...data, startsAt, endsAt, professionalId };
    if (data.status === "canceled") patch.canceledAt = new Date();

    return prisma.appointment.update({
      where: { id },
      data: patch,
      include: fullInclude,
    });
  },

  async cancel(tenantId: string, id: string) {
    await this.get(tenantId, id);
    return prisma.appointment.update({
      where: { id },
      data: { status: "canceled", canceledAt: new Date() },
      include: fullInclude,
    });
  },
};
