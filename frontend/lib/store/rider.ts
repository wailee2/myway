"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEMO } from "../demo";
import { makeId } from "../format";
import type { SavedRoute } from "../types";

interface RiderState {
  /** Most recent stops searched, newest first (max 5). */
  recents: string[];
  usualRoutes: SavedRoute[];
  /** Last device location we were allowed to read, used for "near me" and walking time. */
  lastLocation: { lat: number; lng: number; at: number } | null;
  addRecent: (stopId: string) => void;
  saveUsual: (r: Omit<SavedRoute, "id">) => string;
  updateUsual: (id: string, patch: Partial<Omit<SavedRoute, "id">>) => void;
  removeUsual: (id: string) => void;
  setLocation: (l: { lat: number; lng: number }) => void;
}

/** A rider's saved places and usual routes. Data model first (Phase 1); UI lives in Home and /app/usual. */
export const useRider = create<RiderState>()(
  persist(
    (set) => ({
      recents: DEMO ? ["cbd", "jabi-mall", "nyanya"] : [],
      usualRoutes: DEMO ? [{ id: "u-1", fromId: "nyanya", toId: "cbd", days: [0, 1, 2, 3, 4], time: "07:10" }] : [],
      lastLocation: null,
      addRecent: (id) => set((s) => ({ recents: [id, ...s.recents.filter((x) => x !== id)].slice(0, 5) })),
      saveUsual: (r) => {
        const id = makeId("u");
        set((s) => ({ usualRoutes: [...s.usualRoutes.filter((u) => !(u.fromId === r.fromId && u.toId === r.toId)), { ...r, id }] }));
        return id;
      },
      updateUsual: (id, patch) => set((s) => ({ usualRoutes: s.usualRoutes.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),
      removeUsual: (id) => set((s) => ({ usualRoutes: s.usualRoutes.filter((u) => u.id !== id) })),
      setLocation: (l) => set({ lastLocation: { ...l, at: Date.now() } }),
    }),
    { name: "myway.rider", skipHydration: true, version: 1 },
  ),
);
