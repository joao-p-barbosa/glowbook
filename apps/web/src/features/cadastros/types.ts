/* Tipos completos retornados pela API para os cadastros (F4).
   Mais ricos que os de agenda/types.ts (que são propositalmente enxutos). */

export interface CadClient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
  notes: string | null;
  status: string;
  tag: string | null;
}

export interface CadServiceCategory {
  id: string;
  name: string;
  icon: string | null;
  _count?: { services: number };
}

export interface CadService {
  id: string;
  name: string;
  categoryId: string | null;
  description: string | null;
  durationMin: number;
  priceCents: number;
  color: string | null;
  status: string;
  category: CadServiceCategory | null;
}

export interface CadProfessionalService {
  id: string;
  serviceId: string;
  service: { id: string; name: string };
}

export interface CadProfessional {
  id: string;
  userId?: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  roleTitle: string | null;
  bio: string | null;
  color: string | null;
  initials: string | null;
  status: string;
  professionalServices: CadProfessionalService[];
}

export interface CadSettings {
  brandName: string;
  theme: string;
  whatsappEnabled: boolean;
  appointmentConfirmMsg: boolean;
  reminder24h: boolean;
  reminder1h: boolean;
  reviewRequest: boolean;
}

export interface CadPlan {
  id: string;
  key: string;
  name: string;
  priceCents: number;
  interval: string;
  maxProfessionals: number | null;
  maxServices: number | null;
  maxClients: number | null;
  highlighted: boolean;
  sortOrder: number;
}

export interface CadTenant {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  defaultTheme: string;
  planId: string | null;
  planStatus: string;
  trialEndsAt: string | null;
  plan: CadPlan | null;
}

export interface CadRole {
  id: string;
  name: string;
  description: string | null;
  permissionsJson: string;
  permissions: { all?: boolean; perms?: Record<string, boolean> };
  _count?: { users: number };
}

export interface CadUser {
  id: string;
  name: string;
  email: string;
  status: string;
  roleId: string | null;
  role: { id: string; name: string; permissionsJson?: string } | null;
  professional: { id: string; name: string } | null;
  lastLoginAt: string | null;
}
