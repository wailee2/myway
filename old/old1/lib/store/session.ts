"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "../types";

interface SessionState {
  name: string;
  phone: string;
  role: Role | null;
  verified: boolean;
  onboarded: boolean;
  language: "English" | "Pidgin" | "Hausa";
  setProfile: (p: Partial<Pick<SessionState, "name" | "phone" | "role" | "verified" | "language">>) => void;
  completeOnboarding: () => void;
  signOut: () => void;
}

const initial = { name: "Wailee", phone: "", role: null, verified: false, onboarded: false, language: "English" as const };

/**
 * Persisted to localStorage (MVP stand-in for a real auth session).
 * `skipHydration` avoids server/client mismatches; <HydrationGate/> rehydrates after mount.
 */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      ...initial,
      setProfile: (p) => set(p),
      completeOnboarding: () => set({ onboarded: true }),
      signOut: () => set({ ...initial }),
    }),
    { name: "myway.session", skipHydration: true },
  ),
);
