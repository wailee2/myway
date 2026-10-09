"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";
const KEY = "myway.theme";
const listeners = new Set<() => void>();

function read(): Theme {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(KEY);
  return v === "light" || v === "dark" ? v : "system";
}

function apply(t: Theme) {
  const el = document.documentElement;
  if (t === "system") el.removeAttribute("data-theme");
  else el.setAttribute("data-theme", t);
}

export function useTheme() {
  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => "system" as Theme,
  );
  const setTheme = useCallback((t: Theme) => {
    if (t === "system") window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, t);
    apply(t);
    listeners.forEach((l) => l());
  }, []);
  return { theme, setTheme };
}

/** Inline script (runs before paint) so the saved theme never flashes. */
export const themeInitScript = `try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

function subscribeOs(cb: () => void) {
  const m = window.matchMedia("(prefers-color-scheme: dark)");
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

/**
 * The theme actually in effect ("light" | "dark"), plus a one-tap toggle.
 * `fallback` is what "match my device" resolves to; the driver app passes "dark" so it stays dark by
 * default but can still be switched to light.
 */
export function useResolvedTheme(fallback?: "light" | "dark") {
  const { theme, setTheme } = useTheme();
  const osDark = useSyncExternalStore(subscribeOs, () => window.matchMedia("(prefers-color-scheme: dark)").matches, () => false);
  const mode: "light" | "dark" = theme === "system" ? (fallback ?? (osDark ? "dark" : "light")) : theme;
  return { mode, set: (m: "light" | "dark") => setTheme(m), toggle: () => setTheme(mode === "dark" ? "light" : "dark") };
}
