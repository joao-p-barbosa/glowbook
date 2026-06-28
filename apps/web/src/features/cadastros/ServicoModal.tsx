import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { serviceCreateSchema } from "@glowbook/shared";
import { ApiError } from "../../lib/api";
import { useSaveService } from "./queries";
import type { CadService, CadServiceCategory } from "./types";

type ServiceForm = z.input<typeof serviceCreateSchema>;

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);
const reaisToCents = (v: unknown) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};

interface Props {
  open: boolean;
  service: CadService | null;
  categories: CadServiceCategory[];
  onClose: () => void;
}

export function ServicoModal({ open, service, categories, onClose }: Props) {
  const save = useSaveService();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceForm>({ resolver: zodResolver(serviceCreateSchema) });

  useEffect(() => {
    if (!open) return;
    save.reset();
    reset({
      name: service?.name ?? "",
      categoryId: service?.categoryId ?? "",
      durationMin: service?.durationMin ?? 30,
      priceCents: service ? (service.priceCents / 100).toFixed(2) : "",
      color: service?.color ?? "#c9958a",
      description: service?.description ?? "",
      status: (service?.status as "active" | "inactive") ?? "active",
    } as unknown as ServiceForm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, service]);

  if (!open) return null;

  const onSubmit = handleSubmit((data) => {
    save.mutate({ id: service?.id, data }, { onSuccess: onClose });
  });

  const apiError = save.error instanceof ApiError ? save.error.message : save.error ? "Erro ao salvar" : null;

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={service ? "Editar serviço" : "Novo serviço"}>
        <div className="modal-head">
          <h2>{service ? "Editar serviço" : "Novo serviço"}</h2>
          <button className="x-close" onClick={onClose} aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        <form className="cad-form" onSubmit={onSubmit}>
          {apiError && <div className="login-error" role="alert">{apiError}</div>}

          <div className="field">
            <label htmlFor="sv-name">Nome *</label>
            <input id="sv-name" className="input" placeholder="Ex.: Corte Feminino" {...register("name")} />
            {errors.name && <span className="field-error">{errors.name.message}</span>}
          </div>

          <div className="field">
            <label htmlFor="sv-cat">Categoria</label>
            <select id="sv-cat" className="input" {...register("categoryId", { setValueAs: emptyToNull })}>
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="three">
            <div className="field">
              <label htmlFor="sv-dur">Duração (min) *</label>
              <input id="sv-dur" className="input" type="number" min={1} step={1} {...register("durationMin", { setValueAs: (v) => (v === "" ? NaN : Number(v)) })} />
              {errors.durationMin && <span className="field-error">{errors.durationMin.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="sv-price">Preço (R$) *</label>
              <input id="sv-price" className="input" type="number" min={0} step="0.01" placeholder="0,00" {...register("priceCents", { setValueAs: reaisToCents })} />
              {errors.priceCents && <span className="field-error">{errors.priceCents.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="sv-color">Cor</label>
              <input id="sv-color" className="input" type="color" style={{ padding: 4, height: 42 }} {...register("color")} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="sv-desc">Descrição</label>
            <textarea id="sv-desc" className="input" placeholder="Detalhes do serviço…" {...register("description", { setValueAs: emptyToNull })} />
          </div>

          <div className="field">
            <label htmlFor="sv-status">Situação</label>
            <select id="sv-status" className="input" {...register("status")}>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          <div className="cad-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={save.isPending}>
              {save.isPending ? "Salvando…" : service ? "Salvar alterações" : "Criar serviço"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
