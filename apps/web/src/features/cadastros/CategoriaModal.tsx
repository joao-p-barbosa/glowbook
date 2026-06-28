import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { categoryCreateSchema } from "@glowbook/shared";
import { ApiError } from "../../lib/api";
import { useSaveCategory } from "./queries";
import type { CadServiceCategory } from "./types";

type CategoryForm = z.input<typeof categoryCreateSchema>;
const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

interface Props {
  open: boolean;
  category: CadServiceCategory | null;
  onClose: () => void;
}

export function CategoriaModal({ open, category, onClose }: Props) {
  const save = useSaveCategory();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryForm>({
    resolver: zodResolver(categoryCreateSchema),
  });

  useEffect(() => {
    if (!open) return;
    save.reset();
    reset({ name: category?.name ?? "", icon: category?.icon ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category]);

  if (!open) return null;

  const apiError = save.error instanceof ApiError ? save.error.message : save.error ? "Erro ao salvar" : null;

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={category ? "Editar categoria" : "Nova categoria"}>
        <div className="modal-head">
          <h2>{category ? "Editar categoria" : "Nova categoria"}</h2>
          <button className="x-close" onClick={onClose} aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        <form className="cad-form" onSubmit={handleSubmit((data) => save.mutate({ id: category?.id, data }, { onSuccess: onClose }))}>
          {apiError && <div className="login-error" role="alert">{apiError}</div>}
          <div className="field">
            <label htmlFor="cat-name">Nome *</label>
            <input id="cat-name" className="input" placeholder="Ex.: Cabelo" {...register("name")} />
            {errors.name && <span className="field-error">{errors.name.message}</span>}
          </div>
          <div className="field">
            <label htmlFor="cat-icon">Icone</label>
            <input id="cat-icon" className="input" placeholder="Opcional" {...register("icon", { setValueAs: emptyToNull })} />
          </div>
          <div className="cad-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={save.isPending}>
              {save.isPending ? "Salvando..." : category ? "Salvar alteracoes" : "Criar categoria"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
