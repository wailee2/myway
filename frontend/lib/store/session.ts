"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEMO, DEMO_ACCOUNTS } from "../demo";
import { setToken, setUnauthorizedHandler } from "../api/client";
import type { ApiUser } from "../api/auth";
import type { Role } from "../types";

export interface Account { name: string; phone: string; role: Role; idVerified?: boolean }

const seedAccounts = (): Record<string, Account> =>
  DEMO ? Object.fromEntries(DEMO_ACCOUNTS.map((a) => [a.phone, { ...a, idVerified: true }])) : {};

interface SessionState {
  name: string;
  phone: string;
  role: Role | null;
  /** NIN + selfie done. Riders do this at their FIRST BOOKING; drivers and operators do it up front. */
  idVerified: boolean;
  onboarded: boolean;
  language: "English" | "Pidgin" | "Hausa";
  /** All known accounts by phone. Survives log out so people can log back in. (Stand-in for a server.) */
  accounts: Record<string, Account>;
  setProfile: (p: Partial<Pick<SessionState, "name" | "phone" | "role" | "idVerified" | "language">>) => void;
  completeOnboarding: () => void;
  /** Finish sign-up: saves the account and starts the session. */
  register: (a: Account) => void;
  /** Log in an existing account. Returns its role, or null if no account uses that number. */
  login: (phone: string) => Role | null;
  /** Start the session from a server login (the token is already saved by the caller). */
  signInWith: (u: ApiUser) => void;
  hasAccount: (phone: string) => boolean;
  /** Rename the signed-in account (kept for next log-in too). */
  updateName: (name: string) => void;
  /** Rider finished the NIN + selfie check at first booking. */
  verifyId: () => void;
  signOut: () => void;
}

const initial = { name: "", phone: "", role: null, idVerified: false, onboarded: false, language: "English" as const };

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
      register: (a) => set((st) => ({ accounts: { ...st.accounts, [a.phone]: a }, name: a.name, phone: a.phone, role: a.role, idVerified: Boolean(a.idVerified), onboarded: true })),
      login: (phone) => {
        const acct = get().accounts[phone] ?? seedAccounts()[phone];
        if (!acct) return null;
        set({ name: acct.name, phone, role: acct.role, idVerified: Boolean(acct.idVerified), onboarded: true });
        return acct.role;
      },
      signInWith: (u) => set((st) => ({ name: u.name, phone: u.phone, role: u.role, idVerified: u.id_verified, onboarded: true, accounts: { ...st.accounts, [u.phone]: { name: u.name, phone: u.phone, role: u.role, idVerified: u.id_verified } } })),
      hasAccount: (phone) => Boolean(get().accounts[phone] ?? seedAccounts()[phone]),
      updateName: (name) => set((st) => ({ name, accounts: st.accounts[st.phone] ? { ...st.accounts, [st.phone]: { ...st.accounts[st.phone]!, name } } : st.accounts })),
      verifyId: () => set((st) => ({ idVerified: true, accounts: st.accounts[st.phone] ? { ...st.accounts, [st.phone]: { ...st.accounts[st.phone]!, idVerified: true } } : st.accounts })),
      signOut: () => { setToken(null); set({ ...initial }); },
    }),
    {
      name: "myway.session",
      skipHydration: true,
      version: 2,
      migrate: (persisted, version) => {
        const s = persisted as Record<string, unknown>;
        if (version < 2) {
          // v1 had `verified`; everyone who finished the old flow was fully verified.
          s.idVerified = Boolean(s.verified ?? true);
          delete s.verified;
        }
        return s as unknown as SessionState;
      },
    },
  ),
);

// A rejected token (expired, or the account is gone) means the person has to log in again.
setUnauthorizedHandler(() => useSession.getState().signOut());
