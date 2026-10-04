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
