"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEMO, DEMO_TRUSTED_CONTACTS } from "../demo";
import { makeId } from "../format";

export interface TrustedContact { id: string; name: string; phone: string }

export const REPORT_CATEGORIES = ["Driver was late", "Unsafe driving", "Couldn't find the pickup", "Vehicle issue", "Behaviour or safety concern", "Payment or refund", "Other"] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export interface Report {
  id: string;
  /** Reference shown to the rider so support can find it. */
  ref: string;
  bookingId?: string;
  category: ReportCategory;
  details: string;
  at: number;
  status: "received";
}

interface SafetyState {
  contacts: TrustedContact[];
  autoShare: boolean;
  reports: Report[];
  addContact: (c: Omit<TrustedContact, "id">) => void;
  removeContact: (id: string) => void;
  setAutoShare: (v: boolean) => void;
  /** Files a report. In production this POSTs to the support queue (docs/DATA_PROTECTION_AND_SUPPORT.md). */
  report: (r: { bookingId?: string; category: ReportCategory; details: string }) => Report;
}

export const useSafety = create<SafetyState>()(
  persist(
    (set) => ({
      contacts: DEMO ? DEMO_TRUSTED_CONTACTS : [],
      autoShare: true,
      reports: [],
      addContact: (c) => set((s) => ({ contacts: [...s.contacts, { ...c, id: makeId("tc") }] })),
      removeContact: (id) => set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),
      setAutoShare: (autoShare) => set({ autoShare }),
      report: (r) => {
        const report: Report = { id: makeId("rp"), ref: `MW-${Math.floor(1000 + Math.random() * 9000)}`, at: Date.now(), status: "received", ...r };
        set((s) => ({ reports: [report, ...s.reports] }));
        return report;
      },
    }),
    { name: "myway.safety", skipHydration: true, version: 1 },
  ),
);
