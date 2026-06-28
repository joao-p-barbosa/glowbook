import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { registerSchema, type RegisterInput } from "@glowbook/shared";
import { api, ApiError } from "../lib/api";
import { useAuthStore, type AuthUser } from "../store/auth";
import { THEMES, applyTheme, getStoredTheme, type Theme } from "../lib/theme";
import { SWATCH } from "../components/layout/ThemeSwitcher";

export function SignupPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const [serverError, setServerError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(getStoredTheme());

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    if (ready && user) navigate("/app/agenda", { replace: true });
  }, [ready, user, navigate]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    try {
      const res = await api<{ accessToken: string; user: AuthUser }>("/auth/register", {
        method: "POST",
        body: values,
        skipAuthRetry: true,
      });
      setAuth(res.accessToken, res.user);
      navigate("/app/agenda", { replace: true });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Falha ao criar conta");
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <img className="login-logo" src="/logos/glowbook-light.png" alt="GlowBook" width={168} height={168} />
        </div>
        <p className="login-sub">Crie a conta do seu estúdio</p>

        <form className="login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {serverError && <div className="login-error" role="alert">{serverError}</div>}

          <div className="field">
            <label htmlFor="studioName">Nome do estúdio</label>
            <input id="studioName" className="input" placeholder="Studio Bella" {...register("studioName")} />
            {errors.studioName && <span className="field-error">{errors.studioName.message}</span>}
          </div>

          <div className="field">
            <label htmlFor="name">Seu nome</label>
            <input id="name" className="input" autoComplete="name" placeholder="Maria Silva" {...register("name")} />
            {errors.name && <span className="field-error">{errors.name.message}</span>}
          </div>

          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input id="email" className="input" type="email" autoComplete="email" placeholder="voce@estudio.com" {...register("email")} />
            {errors.email && <span className="field-error">{errors.email.message}</span>}
          </div>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <input id="password" className="input" type="password" autoComplete="new-password" placeholder="mínimo 6 caracteres" {...register("password")} />
            {errors.password && <span className="field-error">{errors.password.message}</span>}
          </div>

          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Criando…" : "Criar conta"}
          </button>
        </form>

        <div className="login-themes" role="group" aria-label="Tema">
          {THEMES.map((t) => (
            <button
              key={t}
              className={`tdot${t === theme ? " active" : ""}`}
              style={{ background: SWATCH[t] }}
              onClick={() => setTheme(t)}
              aria-label={`Tema ${t}`}
              type="button"
            />
          ))}
        </div>

        <p className="login-hint">
          Já tem conta? <Link to="/login" style={{ color: "var(--accent)", fontWeight: 500 }}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}
