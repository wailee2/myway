"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makeId } from "../format";

export interface PostedTrip {
  id: string;
  fromId: string;
  toId: string;
  time: string;
  seats: number;
  price: number;
  womenOnly: boolean;
  repeatWeekdays: boolean;
}

export interface Payout { bank: string; accountNumber: string; accountName: string }
export interface DoneTrip { id: string; fromId: string; toId: string; when: string; riders: number; earned: number }

export const BANKS = ["GTBank", "Access Bank", "Zenith Bank", "First Bank", "UBA", "Opay", "Kuda", "Moniepoint"];

interface DriverState {
  payout: Payout;
  history: DoneTrip[];
  setPayout: (p: Payout) => void;
  online: boolean;
  balance: number;
  activeTrip: PostedTrip | null;
  setOnline: (v: boolean) => void;
  publish: (t: Omit<PostedTrip, "id">) => string;
  endTrip: () => void;
  withdraw: (amount: number) => boolean;
}

export const useDriver = create<DriverState>()(
  persist(
    (set, get) => ({
      payout: { bank: "GTBank", accountNumber: "0123454021", accountName: "Ade Okafor" },
      history: [
        { id: "h1", fromId: "nyanya", toId: "cbd", when: "Yesterday · 7:10", riders: 4, earned: 4320 },
        { id: "h2", fromId: "cbd", toId: "nyanya", when: "Yesterday · 17:30", riders: 3, earned: 3240 },
        { id: "h3", fromId: "nyanya", toId: "cbd", when: "Tue · 7:10", riders: 4, earned: 4320 },
        { id: "h4", fromId: "cbd", toId: "nyanya", when: "Mon · 17:30", riders: 2, earned: 2160 },
      ],
      setPayout: (payout) => set({ payout }),
      online: false,
      balance: 24300,
      activeTrip: null,
      setOnline: (online) => set({ online }),
      publish: (t) => {
        const id = makeId("p");
        set({ activeTrip: { ...t, id }, online: true });
        return id;
      },
      endTrip: () =>
        set((s) => {
          const t = s.activeTrip;
          const done: DoneTrip[] = t ? [{ id: t.id, fromId: t.fromId, toId: t.toId, when: `Today · ${t.time}`, riders: Math.min(t.seats, 3), earned: 3600 }] : [];
          return { activeTrip: null, balance: s.balance + 3600, history: [...done, ...s.history] };
        }),
      withdraw: (amount) => {
        if (amount <= 0 || amount > get().balance) return false;
        set((s) => ({ balance: s.balance - amount }));
        return true;
      },
    }),
    { name: "myway.driver", skipHydration: true },
  ),
);
