import { z } from "zod";

/* ============================================================
   Glowbook — constantes, enums e schemas Zod compartilhados
   ============================================================ */

export const THEMES = ["rose", "blush", "sage", "midnight", "champagne", "lilac"] as const;
export type Theme = (typeof THEMES)[number];

export const APPOINTMENT_STATUSES = [
  "scheduled",
  "confirmed",
  "pending",
  "canceled",
  "completed",
  "no_show",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const CLIENT_TAGS = ["vip", "new", "regular"] as const;
export type ClientTag = (typeof CLIENT_TAGS)[number];

export const ENTITY_STATUSES = ["active", "inactive"] as const;

export const PERMISSION_MODULES = [
  { key: "clients", label: "Clientes" },
  { key: "services", label: "Servicos" },
  { key: "categories", label: "Categorias" },
  { key: "professionals", label: "Equipe" },
  { key: "appointments", label: "Agenda" },
  { key: "users", label: "Usuarios" },
  { key: "roles", label: "Permissoes" },
  { key: "settings", label: "Configuracoes" },
] as const;

export const PERMISSION_ACTIONS = [
  { key: "view", label: "Ver" },
  { key: "manage", label: "Gerenciar" },
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number]["key"];
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number]["key"];
export type PermissionKey = `${PermissionModule}.${PermissionAction}`;

export const PERMISSIONS = PERMISSION_MODULES.flatMap((mod) =>
  PERMISSION_ACTIONS.map((action) => ({
    key: `${mod.key}.${action.key}` as PermissionKey,
    module: mod.key,
    moduleLabel: mod.label,
    action: action.key,
    actionLabel: action.label,
    label: `${mod.label}: ${action.label}`,
  })),
);

export const permissionsSchema = z.object({
  all: z.boolean().optional(),
  perms: z.record(z.boolean()).optional(),
});
export type Permissions = z.infer<typeof permissionsSchema>;

/* ---------------- Auth ---------------- */
export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  studioName: z.string().min(2, "Nome do estúdio obrigatório"),
  name: z.string().min(2, "Seu nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

/* ---------------- Clients ---------------- */
export const clientCreateSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  phone: z.string().trim().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().nullable(),
  birthDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  tag: z.enum(CLIENT_TAGS).optional().nullable(),
  status: z.enum(ENTITY_STATUSES).default("active"),
});
export const clientUpdateSchema = clientCreateSchema.partial();
export type ClientCreateInput = z.infer<typeof clientCreateSchema>;

/* ---------------- Services ---------------- */
export const serviceCreateSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  categoryId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  durationMin: z.coerce.number().int().positive("Duração deve ser positiva"),
  priceCents: z.coerce.number().int().nonnegative("Preço inválido"),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  status: z.enum(ENTITY_STATUSES).default("active"),
});
export const serviceUpdateSchema = serviceCreateSchema.partial();
export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;

/* ---------------- Service Categories ---------------- */
export const categoryCreateSchema = z.object({
  name: z.string().min(1, "Nome obrigatorio"),
  icon: z.string().trim().optional().nullable(),
});
export const categoryUpdateSchema = categoryCreateSchema.partial();
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;

/* ---------------- Professionals ---------------- */
export const professionalCreateSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  phone: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().nullable(),
  roleTitle: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  initials: z.string().max(3).optional().nullable(),
  status: z.enum(ENTITY_STATUSES).default("active"),
  serviceIds: z.array(z.string()).optional(),
});
export const professionalUpdateSchema = professionalCreateSchema.partial();
export type ProfessionalCreateInput = z.infer<typeof professionalCreateSchema>;

/* ---------------- Appointments ---------------- */
export const appointmentCreateSchema = z.object({
  clientId: z.string().min(1, "Cliente obrigatório"),
  serviceId: z.string().min(1, "Serviço obrigatório"),
  professionalId: z.string().min(1, "Profissional obrigatório"),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  notes: z.string().optional().nullable(),
  priceCents: z.coerce.number().int().nonnegative().optional(),
  status: z.enum(APPOINTMENT_STATUSES).default("scheduled"),
});
export const appointmentUpdateSchema = z.object({
  clientId: z.string().optional(),
  serviceId: z.string().optional(),
  professionalId: z.string().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  notes: z.string().optional().nullable(),
  priceCents: z.coerce.number().int().nonnegative().optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
});
export const appointmentQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  professionalId: z.string().optional(),
  clientId: z.string().optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
});
export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;

/* ---------------- Settings ---------------- */
export const settingsUpdateSchema = z.object({
  brandName: z.string().min(1).optional(),
  theme: z.enum(THEMES).optional(),
  whatsappEnabled: z.boolean().optional(),
  appointmentConfirmMsg: z.boolean().optional(),
  reminder24h: z.boolean().optional(),
  reminder1h: z.boolean().optional(),
  reviewRequest: z.boolean().optional(),
});

/* ---------------- Tenant ---------------- */
export const tenantUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  timezone: z.string().optional(),
  defaultTheme: z.enum(THEMES).optional(),
});

/* ---------------- Plans ---------------- */
export const planChangeSchema = z.object({
  planKey: z.string().min(1, "Plano obrigatório"),
});

/* ---------------- Users ---------------- */
export const userCreateSchema = z.object({
  name: z.string().min(1, "Nome obrigatorio"),
  email: z.string().email("E-mail invalido"),
  password: z.string().min(6, "Senha deve ter no minimo 6 caracteres"),
  roleId: z.string().optional().nullable(),
  professionalId: z.string().optional().nullable(),
  status: z.enum(ENTITY_STATUSES).default("active"),
});
export const userUpdateSchema = userCreateSchema
  .omit({ password: true })
  .extend({ password: z.string().min(6, "Senha deve ter no minimo 6 caracteres").optional().or(z.literal("")) })
  .partial();
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

/* ---------------- Roles ---------------- */
export const roleCreateSchema = z.object({
  name: z.string().min(1, "Nome obrigatorio"),
  description: z.string().optional().nullable(),
  permissions: permissionsSchema.default({ perms: {} }),
});
export const roleUpdateSchema = roleCreateSchema.partial();
export type RoleCreateInput = z.infer<typeof roleCreateSchema>;
export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;
