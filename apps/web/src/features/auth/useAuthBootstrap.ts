import { useEffect } from "react";
import { api, refreshAccessToken } from "../../lib/api";
import { useAuthStore, type AuthUser } from "../../store/auth";

/**
 * Na carga inicial tenta restaurar a sessão via refresh cookie → /me.
 * Marca `ready` ao finalizar para liberar as rotas protegidas.
 */
export function useAuthBootstrap() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setReady = useAuthStore((s) => s.setReady);

  useEffect(() => {
    let active = true;
    (async () => {
      const token = await refreshAccessToken();
      if (token && active) {
        try {
          const me = await api<AuthUser>("/auth/me", { skipAuthRetry: true });
          if (active) setAuth(token, me);
        } catch {
          /* token inválido */
        }
      }
      if (active) setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [setAuth, setReady]);
}
