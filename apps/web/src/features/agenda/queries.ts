import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { ApiAppointment, ApiProfessional, ApiClient, ApiService } from "./types";

export function useAppointments(from: Date, to: Date) {
  const fromIso = from.toISOString();
  const toIso = to.toISOString();
  return useQuery({
    queryKey: ["appointments", fromIso, toIso],
    queryFn: () =>
      api<ApiAppointment[]>(`/appointments?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`),
  });
}

export function useProfessionals() {
  return useQuery({
    queryKey: ["professionals"],
    queryFn: () => api<ApiProfessional[]>("/professionals"),
  });
}

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: () => api<ApiClient[]>("/clients"),
  });
}

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: () => api<ApiService[]>("/services"),
  });
}
