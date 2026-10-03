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

interface DriverState {
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
      online: false,
      balance: 24300,
      activeTrip: null,
      setOnline: (online) => set({ online }),
      publish: (t) => {
        const id = makeId("p");
        set({ activeTrip: { ...t, id }, online: true });
        return id;
      },
      endTrip: () => set((s) => ({ activeTrip: null, balance: s.balance + 3600 })),
      withdraw: (amount) => {
        if (amount <= 0 || amount > get().balance) return false;
        set((s) => ({ balance: s.balance - amount }));
        return true;
      },
    }),
    { name: "myway.driver", skipHydration: true },
  ),
);
