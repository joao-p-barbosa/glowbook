import { Queue, Worker, type Job } from "bullmq";
import { env } from "../config/env";
import { bullConnectionOptions, isRedisReady, redis } from "../database/redis";
import { prisma } from "../database/prisma";

/**
 * Fila de lembretes (WhatsApp). Hoje o worker apenas registra a intenção —
 * a integração real entra junto da cobrança/provedor. Serve de base para
 * jobs agendados e, depois, webhooks idempotentes de billing.
 */

const QUEUE_NAME = "reminders";
const enabled = env.REDIS_MODE !== "off";

export type ReminderKind = "24h" | "1h";
interface ReminderJob {
  appointmentId: string;
  kind: ReminderKind;
}

let queue: Queue<ReminderJob> | null = null;
let worker: Worker<ReminderJob> | null = null;

export function getRemindersQueue(): Queue<ReminderJob> | null {
  if (!enabled) return null;
  if (!queue) queue = new Queue<ReminderJob>(QUEUE_NAME, { connection: bullConnectionOptions() });
  return queue;
}

/** Agenda lembretes 24h e 1h antes do horário (apenas os que ainda estão no futuro). */
export async function enqueueAppointmentReminders(appointmentId: string, startsAt: Date) {
  const q = getRemindersQueue();
  if (!q || !isRedisReady()) return; // sem Redis: degrada (não agenda)

  const now = Date.now();
  const offsets: { kind: ReminderKind; ms: number }[] = [
    { kind: "24h", ms: 24 * 60 * 60 * 1000 },
    { kind: "1h", ms: 60 * 60 * 1000 },
  ];

  // best-effort: uma falha na fila nunca derruba a criação do agendamento
  try {
    for (const { kind, ms } of offsets) {
      const delay = startsAt.getTime() - ms - now;
      if (delay <= 0) continue;
      await q.add(
        kind,
        { appointmentId, kind },
        { delay, jobId: `${appointmentId}_${kind}`, removeOnComplete: true, removeOnFail: 100 },
      );
    }
  } catch (err) {
    console.warn(`⚠️  falha ao agendar lembretes: ${(err as Error).message}`);
  }
}

async function process(job: Job<ReminderJob>) {
  const appt = await prisma.appointment.findUnique({
    where: { id: job.data.appointmentId },
    include: { client: true, service: true, tenant: { include: { settings: true } } },
  });
  if (!appt || appt.canceledAt) return; // agendamento sumiu/cancelado → ignora

  const s = appt.tenant.settings;
  const wants = job.data.kind === "24h" ? s?.reminder24h : s?.reminder1h;
  if (!s?.whatsappEnabled || !wants) return; // desativado → não envia

  // TODO(billing/provedor): enviar WhatsApp real aqui.
  console.log(
    `📲 [reminder ${job.data.kind}] ${appt.client.name} · ${appt.service.name} · ${appt.startsAt.toISOString()}`,
  );
}

function spawnWorker() {
  if (worker) return;
  worker = new Worker<ReminderJob>(QUEUE_NAME, process, { connection: bullConnectionOptions() });
  worker.on("failed", (job, err) => {
    console.warn(`⚠️  reminder job ${job?.id} falhou: ${err.message}`);
  });
  console.log("🟥 Worker de lembretes ativo");
}

/**
 * Inicia o worker quando o Redis estiver disponível. Se ainda não conectou,
 * aguarda o evento 'ready' — evita criar conexões BullMQ que ficam tentando
 * reconectar (e poluindo o log) quando o Redis está fora.
 */
export function startRemindersWorker() {
  if (!enabled) return;
  if (isRedisReady()) spawnWorker();
  else redis?.once("ready", spawnWorker);
}

export async function closeQueues() {
  await worker?.close().catch(() => undefined);
  await queue?.close().catch(() => undefined);
}
