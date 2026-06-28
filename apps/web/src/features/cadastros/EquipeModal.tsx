import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { professionalCreateSchema } from "@glowbook/shared";
import { ApiError } from "../../lib/api";
import { useSaveProfessional } from "./queries";
import type { CadProfessional, CadService } from "./types";

type ProForm = z.input<typeof professionalCreateSchema>;

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

interface Props {
  open: boolean;
  professional: CadProfessional | null;
  services: CadService[];
  onClose: () => void;
}

export function EquipeModal({ open, professional, services, onClose }: Props) {
  const save = useSaveProfessional();
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProForm>({ resolver: zodResolver(professionalCreateSchema) });

  useEffect(() => {
    if (!open) return;
    save.reset();
    setServiceIds(professional?.professionalServices.map((ps) => ps.serviceId) ?? []);
    reset({
      name: professional?.name ?? "",
      roleTitle: professional?.roleTitle ?? "",
      phone: professional?.phone ?? "",
      email: professional?.email ?? "",
      initials: professional?.initials ?? "",
      color: professional?.color ?? "#c9958a",
      bio: professional?.bio ?? "",
      status: (professional?.status as "active" | "inactive") ?? "active",
    } as unknown as ProForm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, professional]);

  if (!open) return null;

  function toggle(id: string) {
    setServiceIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  const onSubmit = handleSubmit((data) => {
    save.mutate({ id: professional?.id, data: { ...data, serviceIds } }, { onSuccess: onClose });
  });

  const apiError = save.error instanceof ApiError ? save.error.message : save.error ? "Erro ao salvar" : null;

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={professional ? "Editar profissional" : "Novo profissional"}>
        <div className="modal-head">
          <h2>{professional ? "Editar profissional" : "Novo profissional"}</h2>
          <button className="x-close" onClick={onClose} aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        <form className="cad-form" onSubmit={onSubmit}>
          {apiError && <div className="login-error" role="alert">{apiError}</div>}

          <div className="two">
            <div className="field">
              <label htmlFor="pr-name">Nome *</label>
              <input id="pr-name" className="input" placeholder="Nome completo" {...register("name")} />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="pr-role">Função</label>
              <input id="pr-role" className="input" placeholder="Ex.: Cabeleireira" {...register("roleTitle", { setValueAs: emptyToNull })} />
            </div>
          </div>

          <div className="two">
            <div className="field">
              <label htmlFor="pr-phone">Telefone</label>
              <input id="pr-phone" className="input" type="tel" placeholder="(11) 90000-0000" {...register("phone", { setValueAs: emptyToNull })} />
            </div>
            <div className="field">
              <label htmlFor="pr-email">E-mail</label>
              <input id="pr-email" className="input" type="email" placeholder="email@exemplo.com" {...register("email", { setValueAs: emptyToNull })} />
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </div>
          </div>

          <div className="two">
            <div className="field">
              <label htmlFor="pr-initials">Iniciais</label>
              <input id="pr-initials" className="input" maxLength={3} placeholder="AS" {...register("initials", { setValueAs: emptyToNull })} />
              {errors.initials && <span className="field-error">{errors.initials.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="pr-color">Cor</label>
              <input id="pr-color" className="input" type="color" style={{ padding: 4, height: 42 }} {...register("color")} />
            </div>
          </div>

          <div className="field">
            <label>Serviços habilitados</label>
            {services.length === 0 ? (
              <span className="micro" style={{ textTransform: "none", letterSpacing: 0 }}>Cadastre serviços primeiro para vinculá-los.</span>
            ) : (
              <div className="chk-grid">
                {services.map((s) => {
                  const on = serviceIds.includes(s.id);
                  return (
                    <label key={s.id} className={`chk-item${on ? " on" : ""}`}>
                      <input type="checkbox" checked={on} onChange={() => toggle(s.id)} />
                      <span className="nm">{s.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="pr-bio">Bio</label>
            <textarea id="pr-bio" className="input" placeholder="Especialidades, experiência…" {...register("bio", { setValueAs: emptyToNull })} />
          </div>

          <div className="field">
            <label htmlFor="pr-status">Situação</label>
            <select id="pr-status" className="input" {...register("status")}>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          <div className="cad-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={save.isPending}>
              {save.isPending ? "Salvando…" : professional ? "Salvar alterações" : "Criar profissional"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
