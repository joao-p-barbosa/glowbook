import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { clientCreateSchema, CLIENT_TAGS } from "@glowbook/shared";
import { ApiError } from "../../lib/api";
import { useSaveClient } from "./queries";
import type { CadClient } from "./types";

type ClientForm = z.input<typeof clientCreateSchema>;

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

const TAG_LABEL: Record<string, string> = { vip: "VIP", new: "Novo", regular: "Regular" };

interface Props {
  open: boolean;
  client: CadClient | null; // null = criar
  onClose: () => void;
}

export function ClienteModal({ open, client, onClose }: Props) {
  const save = useSaveClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientForm>({ resolver: zodResolver(clientCreateSchema) });

  useEffect(() => {
    if (!open) return;
    save.reset();
    reset({
      name: client?.name ?? "",
      phone: client?.phone ?? "",
      email: client?.email ?? "",
      birthDate: client?.birthDate ? client.birthDate.slice(0, 10) : "",
      tag: (client?.tag as ClientForm["tag"]) ?? "",
      notes: client?.notes ?? "",
      status: (client?.status as "active" | "inactive") ?? "active",
    } as unknown as ClientForm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client]);

  if (!open) return null;

  const onSubmit = handleSubmit((data) => {
    save.mutate(
      { id: client?.id, data },
      { onSuccess: onClose },
    );
  });

  const apiError = save.error instanceof ApiError ? save.error.message : save.error ? "Erro ao salvar" : null;

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={client ? "Editar cliente" : "Novo cliente"}>
        <div className="modal-head">
          <h2>{client ? "Editar cliente" : "Novo cliente"}</h2>
          <button className="x-close" onClick={onClose} aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        <form className="cad-form" onSubmit={onSubmit}>
          {apiError && <div className="login-error" role="alert">{apiError}</div>}

          <div className="field">
            <label htmlFor="cl-name">Nome *</label>
            <input id="cl-name" className="input" placeholder="Nome completo" {...register("name")} />
            {errors.name && <span className="field-error">{errors.name.message}</span>}
          </div>

          <div className="two">
            <div className="field">
              <label htmlFor="cl-phone">Telefone</label>
              <input id="cl-phone" className="input" type="tel" placeholder="(11) 90000-0000" {...register("phone", { setValueAs: emptyToNull })} />
            </div>
            <div className="field">
              <label htmlFor="cl-birth">Nascimento</label>
              <input id="cl-birth" className="input" type="date" {...register("birthDate", { setValueAs: (v) => (v ? new Date(v) : null) })} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="cl-email">E-mail</label>
            <input id="cl-email" className="input" type="email" placeholder="email@exemplo.com" {...register("email", { setValueAs: emptyToNull })} />
            {errors.email && <span className="field-error">{errors.email.message}</span>}
          </div>

          <div className="two">
            <div className="field">
              <label htmlFor="cl-tag">Classificação</label>
              <select id="cl-tag" className="input" {...register("tag", { setValueAs: emptyToNull })}>
                <option value="">Sem classificação</option>
                {CLIENT_TAGS.map((t) => (
                  <option key={t} value={t}>{TAG_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="cl-status">Situação</label>
              <select id="cl-status" className="input" {...register("status")}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="cl-notes">Observações</label>
            <textarea id="cl-notes" className="input" placeholder="Preferências, alergias, anotações…" {...register("notes", { setValueAs: emptyToNull })} />
          </div>

          <div className="cad-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={save.isPending}>
              {save.isPending ? "Salvando…" : client ? "Salvar alterações" : "Criar cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
