/**
 * Thin client for the FastAPI backend. Same-origin `/api/*` is forwarded by next.config.ts.
 * Errors are unwrapped from the backend's `{ error: { code, message, ...extra } }` shape into ApiError,
 * so callers can switch on `code` (NO_TRIP, SEAT_TAKEN, INSUFFICIENT_FUNDS, ID_REQUIRED, ...).
 */
export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number, public extra: Record<string, unknown> = {}) {
    super(message);
  }
}

const TOKEN_KEY = "myway.token";
export const getToken = () => (typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY));
export const setToken = (t: string | null) => {
  if (typeof window === "undefined") return;
  if (t) window.localStorage.setItem(TOKEN_KEY, t);
  else window.localStorage.removeItem(TOKEN_KEY);
};

/** Called when the server says the saved login is no longer valid (expired or unknown). The session store signs out. */
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? (init.body ? "POST" : "GET"),
      headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError("UNAVAILABLE", "Can't reach the server. Check your connection and try again.", 0);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = (data as { error?: { code?: string; message?: string } } | null)?.error;
    const { code, message, ...extra } = e ?? {};
    if (code === "AUTH_REQUIRED" && token) onUnauthorized?.();
    throw new ApiError(code ?? "UNAVAILABLE", message ?? "Something went wrong. Try again.", res.status, extra);
  }
  return data as T;
}
