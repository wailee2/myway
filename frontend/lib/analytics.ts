/**
 * Tiny local event log for the "Success measures" in the roadmap (search→booking, time to book, cancellations…).
 * Events stay on the device (last 300). Swap `track` for a real analytics call once consent is sorted
 * (see docs/DATA_PROTECTION_AND_SUPPORT.md).
 */
const KEY = "myway.events";
const FLOW = "myway.flowStart";

export interface TrackedEvent { name: string; at: number; props?: Record<string, string | number | boolean> }

export function track(name: string, props?: TrackedEvent["props"]) {
  if (typeof window === "undefined") return;
  try {
    const list: TrackedEvent[] = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    list.push({ name, at: Date.now(), props });
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(-300)));
  } catch { /* storage blocked: analytics must never break the app */ }
}

export const readEvents = (): TrackedEvent[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
};

/** Call when the rider opens Home: starts the "open to booking" timer for this visit. */
export function startFlow() {
  try { if (!window.sessionStorage.getItem(FLOW)) window.sessionStorage.setItem(FLOW, String(Date.now())); } catch { /* ignore */ }
}

/** Milliseconds since startFlow(), and resets the timer. */
export function endFlow() {
  try {
    const start = Number(window.sessionStorage.getItem(FLOW));
    window.sessionStorage.removeItem(FLOW);
    return start ? Date.now() - start : undefined;
  } catch { return undefined; }
}
