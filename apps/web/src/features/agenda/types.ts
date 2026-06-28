export interface ApiClient {
  id: string;
  name: string;
  phone: string | null;
  tag: string | null;
}
export interface ApiService {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  color: string | null;
  categoryId: string | null;
}
export interface ApiProfessional {
  id: string;
  name: string;
  color: string | null;
  initials: string | null;
  roleTitle: string | null;
}
export interface ApiAppointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  notes: string | null;
  priceCents: number;
  client: ApiClient;
  service: ApiService;
  professional: ApiProfessional;
}
