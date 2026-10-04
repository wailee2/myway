"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "../types";

export interface Account { name: string; phone: string; role: Role }

/** Demo accounts so you can try all three apps in one tap from the log-in screen. */
export const DEMO_ACCOUNTS: Account[] = [
  { name: "Wailee Kareem", phone: "8011111111", role: "rider" },
  { name: "Ade Okafor", phone: "8022222222", role: "driver" },
  { name: "Cityline Coaches", phone: "8033333333", role: "operator" },
];
const seedAccounts = (): Record<string, Account> => Object.fromEntries(DEMO_ACCOUNTS.map((a) => [a.phone, a]));

interface SessionState {
  name: string;
  phone: string;
  role: Role | null;
  verified: boolean;
  onboarded: boolean;
  language: "English" | "Pidgin" | "Hausa";
  /** All known accounts by phone. Survives log out so people can log back in. (Stand-in for a server.) */
  accounts: Record<string, Account>;
  setProfile: (p: Partial<Pick<SessionState, "name" | "phone" | "role" | "verified" | "language">>) => void;
  completeOnboarding: () => void;
  /** Finish sign-up: saves the account and starts the session. */
  register: (a: Account) => void;
  /** Log in an existing account. Returns its role, or null if no account uses that number. */
  login: (phone: string) => Role | null;
  /** Is there already an account for this number? */
  hasAccount: (phone: string) => boolean;
  /** Rename the signed-in account (kept for next log-in too). */
  updateName: (name: string) => void;
  signOut: () => void;
}

const initial = { name: "", phone: "", role: null, verified: false, onboarded: false, language: "English" as const };

/**
 * Persisted to localStorage (MVP stand-in for a real auth session).
 * `skipHydration` avoids server/client mismatches; useHydrated() rehydrates after mount.
 */
export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      ...initial,
      accounts: seedAccounts(),
      setProfile: (p) => set(p),
      completeOnboarding: () => set({ onboarded: true }),
      register: (a) => set((st) => ({ accounts: { ...st.accounts, [a.phone]: a }, name: a.name, phone: a.phone, role: a.role, verified: true, onboarded: true })),
      login: (phone) => {
        const acct = get().accounts[phone] ?? seedAccounts()[phone];
        if (!acct) return null;
        set({ name: acct.name, phone, role: acct.role, verified: true, onboarded: true });
        return acct.role;
      },
      hasAccount: (phone) => Boolean(get().accounts[phone] ?? seedAccounts()[phone]),
      updateName: (name) => set((st) => ({ name, accounts: st.accounts[st.phone] ? { ...st.accounts, [st.phone]: { ...st.accounts[st.phone]!, name } } : st.accounts })),
      signOut: () => set({ ...initial }),
    }),
    { name: "myway.session", skipHydration: true },
  ),
);
