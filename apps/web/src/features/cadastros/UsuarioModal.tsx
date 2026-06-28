import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { userCreateSchema, userUpdateSchema } from "@glowbook/shared";
import { ApiError } from "../../lib/api";
import { useSaveUser } from "./queries";
import type { CadProfessional, CadRole, CadUser } from "./types";

type UserForm = z.input<typeof userCreateSchema> & { password?: string };
const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

interface Props {
  open: boolean;
  user: CadUser | null;
  roles: CadRole[];
  professionals: CadProfessional[];
  onClose: () => void;
}

export function UsuarioModal({ open, user, roles, professionals, onClose }: Props) {
  const save = useSaveUser();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(user ? userUpdateSchema : userCreateSchema),
  });

  useEffect(() => {
    if (!open) return;
    save.reset();
    reset({
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      roleId: user?.roleId ?? "",
      professionalId: user?.professional?.id ?? "",
      status: (user?.status as "active" | "inactive") ?? "active",
    } as UserForm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  if (!open) return null;

  const availableProfessionals = professionals.filter((p) => !p.userId || p.userId === user?.id);
  const apiError = save.error instanceof ApiError ? save.error.message : save.error ? "Erro ao salvar" : null;

  const onSubmit = handleSubmit((values) => {
    const data: Record<string, unknown> = { ...values };
    if (user && !data.password) delete data.password;
    save.mutate({ id: user?.id, data }, { onSuccess: onClose });
  });

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={user ? "Editar usuario" : "Novo usuario"}>
        <div className="modal-head">
          <h2>{user ? "Editar usuario" : "Novo usuario"}</h2>
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
              <label htmlFor="usr-name">Nome *</label>
              <input id="usr-name" className="input" {...register("name")} />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="usr-email">E-mail *</label>
              <input id="usr-email" className="input" type="email" autoComplete="email" {...register("email")} />
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </div>
          </div>

          <div className="two">
            <div className="field">
              <label htmlFor="usr-pass">{user ? "Nova senha" : "Senha *"}</label>
              <input id="usr-pass" className="input" type="password" autoComplete="new-password" {...register("password")} />
              {errors.password && <span className="field-error">{errors.password.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="usr-status">Situacao</label>
              <select id="usr-status" className="input" {...register("status")}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>

          <div className="two">
            <div className="field">
              <label htmlFor="usr-role">Papel</label>
              <select id="usr-role" className="input" {...register("roleId", { setValueAs: emptyToNull })}>
                <option value="">Sem papel</option>
                {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="usr-prof">Profissional vinculado</label>
              <select id="usr-prof" className="input" {...register("professionalId", { setValueAs: emptyToNull })}>
                <option value="">Sem vinculo</option>
                {availableProfessionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="cad-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={save.isPending}>
              {save.isPending ? "Salvando..." : user ? "Salvar alteracoes" : "Criar usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
