import { useAuthStore } from "../store/auth";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333/api";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  // não tenta refresh (usado pelo próprio refresh)
  skipAuthRetry?: boolean;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { accessToken: string };
    useAuthStore.getState().setToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, skipAuthRetry } = opts;
  const token = useAuthStore.getState().accessToken;

  const doFetch = (authToken: string | null) =>
    fetch(`${BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch(token);

  // tenta refresh uma vez em 401
  if (res.status === 401 && !skipAuthRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(newToken);
    } else {
      useAuthStore.getState().clear();
    }
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as { error?: { message?: string; code?: string; details?: unknown } })?.error;
    throw new ApiError(res.status, err?.message ?? "Erro na requisição", err?.code, err?.details);
  }
  return data as T;
}

export { refreshAccessToken, BASE_URL };
