import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function startOfWeekMonday(d = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0=dom
  const diff = (day === 0 ? -6 : 1) - day; // volta para segunda
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function at(base: Date, addDays: number, hour: number, minute = 0): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + addDays);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log("🌱 Limpando dados...");
  await prisma.appointment.deleteMany();
  await prisma.professionalService.deleteMany();
  await prisma.workingHour.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.client.deleteMany();
  await prisma.tenantSetting.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.plan.deleteMany();

  console.log("💳 Criando planos...");
  const plansSeed = [
    { key: "free", name: "Free", priceCents: 0, maxProfessionals: 1, maxServices: 5, maxClients: 50, highlighted: false, sortOrder: 0 },
    { key: "pro", name: "Pro", priceCents: 9900, maxProfessionals: 5, maxServices: 50, maxClients: 1000, highlighted: true, sortOrder: 1 },
    { key: "studio", name: "Studio", priceCents: 24900, maxProfessionals: null, maxServices: null, maxClients: null, highlighted: false, sortOrder: 2 },
  ];
  const plans: Record<string, string> = {};
  for (const p of plansSeed) {
    const created = await prisma.plan.create({ data: p });
    plans[p.key] = created.id;
  }

  console.log("🏢 Criando tenant...");
  const tenant = await prisma.tenant.create({
    data: {
      name: "Studio Bella",
      slug: "studio-bella",
      timezone: "America/Sao_Paulo",
      defaultTheme: "rose",
      status: "active",
      planId: plans.pro,
      planStatus: "active",
      settings: {
        create: {
          brandName: "Studio Bella",
          theme: "rose",
          whatsappEnabled: true,
          appointmentConfirmMsg: true,
          reminder24h: true,
          reminder1h: true,
          reviewRequest: false,
        },
      },
    },
  });

  const adminRole = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: "Admin",
      description: "Acesso total",
      permissionsJson: JSON.stringify({ all: true }),
    },
  });

  console.log("👤 Criando usuário admin...");
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      roleId: adminRole.id,
      name: "Admin Glowbook",
      email: "admin@glowbook.local",
      passwordHash: await bcrypt.hash("123456", 10),
      status: "active",
    },
  });

  console.log("💇 Criando categorias e serviços...");
  const categoriesData = ["Cabelo", "Unhas", "Estética", "Sobrancelhas", "Massagem"];
  const categories: Record<string, string> = {};
  for (const name of categoriesData) {
    const c = await prisma.serviceCategory.create({ data: { tenantId: tenant.id, name } });
    categories[name] = c.id;
  }

  const servicesSeed = [
    { name: "Corte Feminino", cat: "Cabelo", durationMin: 60, priceCents: 9000, color: "#c9958a" },
    { name: "Escova", cat: "Cabelo", durationMin: 45, priceCents: 6000, color: "#d4a373" },
    { name: "Coloração", cat: "Cabelo", durationMin: 120, priceCents: 18000, color: "#b08968" },
    { name: "Mechas", cat: "Cabelo", durationMin: 150, priceCents: 24000, color: "#a78b7a" },
    { name: "Manicure", cat: "Unhas", durationMin: 45, priceCents: 4000, color: "#cf7d72" },
    { name: "Pedicure", cat: "Unhas", durationMin: 50, priceCents: 4500, color: "#c4587a" },
    { name: "Design de Sobrancelhas", cat: "Sobrancelhas", durationMin: 30, priceCents: 5000, color: "#7c54c8" },
    { name: "Limpeza de Pele", cat: "Estética", durationMin: 60, priceCents: 12000, color: "#6fae8f" },
    { name: "Massagem Relaxante", cat: "Massagem", durationMin: 60, priceCents: 14000, color: "#7b9cff" },
  ];
  const services: Record<string, { id: string; durationMin: number; priceCents: number }> = {};
  for (const s of servicesSeed) {
    const created = await prisma.service.create({
      data: {
        tenantId: tenant.id,
        categoryId: categories[s.cat],
        name: s.name,
        durationMin: s.durationMin,
        priceCents: s.priceCents,
        color: s.color,
        status: "active",
      },
    });
    services[s.name] = { id: created.id, durationMin: s.durationMin, priceCents: s.priceCents };
  }

  console.log("✂️ Criando profissionais...");
  const profSeed = [
    { name: "Ana Souza", initials: "AS", color: "#c9958a", roleTitle: "Cabeleireira" },
    { name: "Beatriz Lima", initials: "BL", color: "#7b9cff", roleTitle: "Esteticista" },
    { name: "Carla Mendes", initials: "CM", color: "#6fae8f", roleTitle: "Manicure" },
    { name: "Fernanda Rocha", initials: "FR", color: "#7c54c8", roleTitle: "Designer de sobrancelhas" },
  ];
  const professionals: Record<string, string> = {};
  for (const p of profSeed) {
    const created = await prisma.professional.create({
      data: { tenantId: tenant.id, ...p, status: "active" },
    });
    professionals[p.name] = created.id;

    // horário de trabalho seg-sáb 09:00-19:00
    for (let weekday = 1; weekday <= 6; weekday++) {
      await prisma.workingHour.create({
        data: {
          tenantId: tenant.id,
          professionalId: created.id,
          weekday,
          startTime: "09:00",
          endTime: "19:00",
          isActive: true,
        },
      });
    }
  }

  // vínculo profissional ↔ serviço
  const links: Array<[string, string]> = [
    ["Ana Souza", "Corte Feminino"], ["Ana Souza", "Escova"], ["Ana Souza", "Coloração"], ["Ana Souza", "Mechas"],
    ["Beatriz Lima", "Limpeza de Pele"], ["Beatriz Lima", "Massagem Relaxante"],
    ["Carla Mendes", "Manicure"], ["Carla Mendes", "Pedicure"],
    ["Fernanda Rocha", "Design de Sobrancelhas"], ["Fernanda Rocha", "Limpeza de Pele"],
  ];
  for (const [prof, svc] of links) {
    await prisma.professionalService.create({
      data: { tenantId: tenant.id, professionalId: professionals[prof], serviceId: services[svc].id },
    });
  }

  console.log("🙋 Criando clientes...");
  const clientsSeed = [
    { name: "Mariana Costa", phone: "(11) 90000-0001", tag: "vip" },
    { name: "Juliana Alves", phone: "(11) 90000-0002", tag: "regular" },
    { name: "Patrícia Gomes", phone: "(11) 90000-0003", tag: "new" },
    { name: "Camila Ferreira", phone: "(11) 90000-0004", tag: "regular" },
    { name: "Renata Martins", phone: "(11) 90000-0005", tag: "vip" },
  ];
  const clients: Record<string, string> = {};
  for (const c of clientsSeed) {
    const created = await prisma.client.create({
      data: { tenantId: tenant.id, name: c.name, phone: c.phone, tag: c.tag, status: "active" },
    });
    clients[c.name] = created.id;
  }

  console.log("📅 Criando agendamentos da semana...");
  const week = startOfWeekMonday();
  const plan: Array<{ day: number; hour: number; client: string; service: string; prof: string; status: string }> = [
    { day: 0, hour: 9,  client: "Mariana Costa",   service: "Corte Feminino",          prof: "Ana Souza",      status: "confirmed" },
    { day: 0, hour: 11, client: "Juliana Alves",   service: "Manicure",                prof: "Carla Mendes",   status: "scheduled" },
    { day: 1, hour: 10, client: "Patrícia Gomes",  service: "Mechas",                  prof: "Ana Souza",      status: "scheduled" },
    { day: 1, hour: 14, client: "Camila Ferreira", service: "Limpeza de Pele",         prof: "Beatriz Lima",   status: "confirmed" },
    { day: 2, hour: 9,  client: "Renata Martins",  service: "Design de Sobrancelhas",  prof: "Fernanda Rocha", status: "completed" },
    { day: 2, hour: 13, client: "Mariana Costa",   service: "Massagem Relaxante",      prof: "Beatriz Lima",   status: "scheduled" },
    { day: 3, hour: 10, client: "Juliana Alves",   service: "Coloração",               prof: "Ana Souza",      status: "scheduled" },
    { day: 3, hour: 15, client: "Patrícia Gomes",  service: "Pedicure",                prof: "Carla Mendes",   status: "pending" },
    { day: 4, hour: 9,  client: "Camila Ferreira", service: "Escova",                  prof: "Ana Souza",      status: "scheduled" },
    { day: 4, hour: 11, client: "Renata Martins",  service: "Limpeza de Pele",         prof: "Fernanda Rocha", status: "confirmed" },
    { day: 5, hour: 10, client: "Mariana Costa",   service: "Design de Sobrancelhas",  prof: "Fernanda Rocha", status: "scheduled" },
  ];

  for (const a of plan) {
    const svc = services[a.service];
    const startsAt = at(week, a.day, a.hour);
    const endsAt = new Date(startsAt.getTime() + svc.durationMin * 60_000);
    await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        clientId: clients[a.client],
        serviceId: svc.id,
        professionalId: professionals[a.prof],
        startsAt,
        endsAt,
        priceCents: svc.priceCents,
        status: a.status,
      },
    });
  }

  console.log("✅ Seed concluído.");
  console.log("   Login: admin@glowbook.local / 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
