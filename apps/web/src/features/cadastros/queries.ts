import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type {
  CadClient,
  CadProfessional,
  CadService,
  CadSettings,
  CadTenant,
  CadServiceCategory,
  CadRole,
  CadUser,
  CadPlan,
} from "./types";

/* ---------------- Clientes ---------------- */
export function useClientsList() {
  return useQuery({ queryKey: ["clients"], queryFn: () => api<CadClient[]>("/clients") });
}

export function useSaveClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: unknown }) =>
      api<CadClient>(id ? `/clients/${id}` : "/clients", { method: id ? "PATCH" : "POST", body: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/clients/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

/* ---------------- Serviços ---------------- */
export function useServicesList() {
  return useQuery({ queryKey: ["services"], queryFn: () => api<CadService[]>("/services") });
}

export function useSaveService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: unknown }) =>
      api<CadService>(id ? `/services/${id}` : "/services", { method: id ? "PATCH" : "POST", body: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/services/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}

/* ---------------- Categorias ---------------- */
export function useCategoriesList() {
  return useQuery({ queryKey: ["categories"], queryFn: () => api<CadServiceCategory[]>("/categories") });
}

export function useSaveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: unknown }) =>
      api<CadServiceCategory>(id ? `/categories/${id}` : "/categories", {
        method: id ? "PATCH" : "POST",
        body: data,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

/* ---------------- Equipe ---------------- */
export function useProfessionalsList() {
  return useQuery({ queryKey: ["professionals"], queryFn: () => api<CadProfessional[]>("/professionals") });
}

export function useSaveProfessional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: unknown }) =>
      api<CadProfessional>(id ? `/professionals/${id}` : "/professionals", {
        method: id ? "PATCH" : "POST",
        body: data,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professionals"] }),
  });
}

export function useDeleteProfessional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/professionals/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professionals"] }),
  });
}

/* ---------------- Configurações ---------------- */
export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: () => api<CadSettings>("/settings") });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CadSettings>) => api<CadSettings>("/settings", { method: "PATCH", body: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useTenant() {
  return useQuery({ queryKey: ["tenant"], queryFn: () => api<CadTenant>("/tenants/current") });
}

export function useSaveTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CadTenant>) => api<CadTenant>("/tenants/current", { method: "PATCH", body: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenant"] }),
  });
}

/* ---------------- Planos ---------------- */
export function usePlans() {
  return useQuery({ queryKey: ["plans"], queryFn: () => api<CadPlan[]>("/plans") });
}

export function useChangePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planKey: string) =>
      api<CadTenant>("/tenants/current/plan", { method: "PATCH", body: { planKey } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenant"] }),
  });
}

/* ---------------- Papeis ---------------- */
export function useRolesList() {
  return useQuery({ queryKey: ["roles"], queryFn: () => api<CadRole[]>("/roles") });
}

export function useSaveRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: unknown }) =>
      api<CadRole>(id ? `/roles/${id}` : "/roles", { method: id ? "PATCH" : "POST", body: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/roles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

/* ---------------- Usuarios ---------------- */
export function useUsersList() {
  return useQuery({ queryKey: ["users"], queryFn: () => api<CadUser[]>("/users") });
}

export function useSaveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: unknown }) =>
      api<CadUser>(id ? `/users/${id}` : "/users", { method: id ? "PATCH" : "POST", body: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["professionals"] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["professionals"] });
    },
  });
}
