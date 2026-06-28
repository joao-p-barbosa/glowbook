import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PERMISSION_ACTIONS, PERMISSION_MODULES, roleCreateSchema } from "@glowbook/shared";
import { ApiError } from "../../lib/api";
import { useSaveRole } from "./queries";
import type { CadRole } from "./types";

type RoleForm = z.input<typeof roleCreateSchema>;

interface Props {
  open: boolean;
  role: CadRole | null;
  onClose: () => void;
}

export function PapelModal({ open, role, onClose }: Props) {
  const save = useSaveRole();
  const [all, setAll] = useState(false);
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoleForm>({
    resolver: zodResolver(roleCreateSchema),
  });

  useEffect(() => {
    if (!open) return;
    save.reset();
    const next = role?.permissions ?? { perms: {} };
    setAll(Boolean(next.all));
    setPerms(next.perms ?? {});
    reset({ name: role?.name ?? "", description: role?.description ?? "", permissions: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, role]);

  if (!open) return null;

  const apiError = save.error instanceof ApiError ? save.error.message : save.error ? "Erro ao salvar" : null;
  const onSubmit = handleSubmit((values) => {
    save.mutate(
      { id: role?.id, data: { ...values, permissions: all ? { all: true } : { perms } } },
      { onSuccess: onClose },
    );
  });

  function togglePermission(key: string, checked: boolean) {
    setPerms((current) => ({ ...current, [key]: checked }));
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={role ? "Editar papel" : "Novo papel"}>
        <div className="modal-head">
          <h2>{role ? "Editar papel" : "Novo papel"}</h2>
          <button className="x-close" onClick={onClose} aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        <form className="cad-form role-form" onSubmit={onSubmit}>
          {apiError && <div className="login-error" role="alert">{apiError}</div>}
          <div className="two">
            <div className="field">
              <label htmlFor="role-name">Nome *</label>
              <input id="role-name" className="input" {...register("name")} />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="role-desc">Descricao</label>
              <input id="role-desc" className="input" {...register("description")} />
            </div>
          </div>

          <div className="toggle-row no-border">
            <div className="tr-text">
              <div className="t">Acesso total</div>
              <div className="d">Ignora as permissoes individuais deste papel.</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} aria-label="Acesso total" />
              <span className="track" />
            </label>
          </div>

          <div className="permission-grid" aria-disabled={all}>
            <div className="permission-row permission-head">
              <span>Modulo</span>
              {PERMISSION_ACTIONS.map((action) => <span key={action.key}>{action.label}</span>)}
            </div>
            {PERMISSION_MODULES.map((mod) => (
              <div className="permission-row" key={mod.key}>
                <span>{mod.label}</span>
                {PERMISSION_ACTIONS.map((action) => {
                  const key = `${mod.key}.${action.key}`;
                  return (
                    <label className="chk-mini" key={key}>
                      <input
                        type="checkbox"
                        disabled={all}
                        checked={Boolean(perms[key])}
                        onChange={(e) => togglePermission(key, e.target.checked)}
                        aria-label={`${mod.label}: ${action.label}`}
                      />
                    </label>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="cad-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={save.isPending}>
              {save.isPending ? "Salvando..." : role ? "Salvar alteracoes" : "Criar papel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
