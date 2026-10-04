"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "../types";

export interface Account { name: string; phone: string; role: Role }

interface SessionState {
  name: string;
  phone: string;
  role: Role | null;
  verified: boolean;
  onboarded: boolean;
  language: "English" | "Pidgin" | "Hausa";
  /** Survives log out, so an existing user can log back in. (MVP stand-in for a server-side account.) */
  account: Account | null;
  setProfile: (p: Partial<Pick<SessionState, "name" | "phone" | "role" | "verified" | "language">>) => void;
  completeOnboarding: () => void;
  /** Finish sign-up: saves the account and starts the session. */
  register: (a: Account) => void;
  /** Log in an existing user (any valid number in this demo; it restores the saved account if the number matches). */
  login: (phone: string) => Role;
  signOut: () => void;
}

const initial = { name: "", phone: "", role: null, verified: false, onboarded: false, language: "English" as const };

/**
 * Persisted to localStorage (MVP stand-in for a real auth session).
 * `skipHydration` avoids server/client mismatches; <HydrationGate/> rehydrates after mount.
 */
export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      ...initial,
      account: null,
      setProfile: (p) => set(p),
      completeOnboarding: () => set({ onboarded: true }),
      register: (a) => set({ account: a, name: a.name, phone: a.phone, role: a.role, verified: true, onboarded: true }),
      login: (phone) => {
        const known = get().account;
        const match = known && known.phone === phone ? known : null;
        const role: Role = match?.role ?? "rider";
        set({ name: match?.name ?? "", phone, role, verified: true, onboarded: true });
        return role;
      },
      signOut: () => set({ ...initial }),
    }),
    { name: "myway.session", skipHydration: true },
  ),
);
