import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { loginSchema, type LoginInput } from "@glowbook/shared";
import { api, ApiError } from "../lib/api";
import { useAuthStore, type AuthUser } from "../store/auth";
import { THEMES, applyTheme, getStoredTheme, type Theme } from "../lib/theme";
import { SWATCH } from "../components/layout/ThemeSwitcher";

export function LoginPage() {
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
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@glowbook.local", password: "123456" },
  });

  // já autenticado → vai pra agenda
  useEffect(() => {
    if (ready && user) navigate("/app/agenda", { replace: true });
  }, [ready, user, navigate]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    try {
      const res = await api<{ accessToken: string; user: AuthUser }>("/auth/login", {
        method: "POST",
        body: values,
        skipAuthRetry: true,
      });
      setAuth(res.accessToken, res.user);
      navigate("/app/agenda", { replace: true });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Falha ao entrar");
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <img className="login-logo" src="/logos/glowbook-light.png" alt="GlowBook" width={168} height={168} />
        </div>

        <form className="login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {serverError && <div className="login-error" role="alert">{serverError}</div>}

          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              placeholder="voce@estudio.com"
              {...register("email")}
            />
            {errors.email && <span className="field-error">{errors.email.message}</span>}
          </div>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••"
              {...register("password")}
            />
            {errors.password && <span className="field-error">{errors.password.message}</span>}
          </div>

          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Entrando…" : "Entrar"}
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
          Demonstração: <strong>admin@glowbook.local</strong> / <strong>123456</strong>
        </p>
        <p className="login-hint">
          Não tem conta? <Link to="/signup" style={{ color: "var(--accent)", fontWeight: 500 }}>Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
