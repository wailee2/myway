"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEMO } from "../demo";
import { makeId } from "../format";
import { driverShare } from "../pricing";

export interface PostedTrip {
  id: string;
  fromId: string;
  toId: string;
  /** 24h "07:10" */
  time: string;
  seats: number;
  /** All-in price per seat the rider pays. */
  price: number;
  womenOnly: boolean;
  /** Never switched on silently: defaults to OFF in the post-trip form. */
  repeatWeekdays: boolean;
}

export interface DriverRider { name: string; seat: string; code: string; boarded: boolean; noShow: boolean }

export interface Payout { bank: string; accountNumber: string; accountName: string }
export interface DoneTrip { id: string; fromId: string; toId: string; when: string; riders: number; earned: number }

export const BANKS = ["GTBank", "Access Bank", "Zenith Bank", "First Bank", "UBA", "Opay", "Kuda", "Moniepoint"];

type BoardResult = { ok: true; name: string; seat: string } | { ok: false; code: "NO_MATCH" | "ALREADY_BOARDED"; message: string };

interface DriverState {
  payout: Payout;
  history: DoneTrip[];
  setPayout: (p: Payout) => void;
  online: boolean;
  balance: number;
  activeTrip: PostedTrip | null;
  riders: DriverRider[];
  started: boolean;
  setOnline: (v: boolean) => void;
  publish: (t: Omit<PostedTrip, "id">) => string;
  /** A rider books a seat on the active trip. (Backend event in production.) */
  addRider: (r: Omit<DriverRider, "boarded" | "noShow">) => void;
  board: (code: string) => BoardResult;
  markNoShow: (name: string) => void;
  startTrip: () => void;
  /** Ends the trip and returns what the driver earned. */
  endTrip: () => number;
  withdraw: (amount: number) => boolean;
}

export const useDriver = create<DriverState>()(
  persist(
    (set, get) => ({
      payout: DEMO ? { bank: "GTBank", accountNumber: "0123454021", accountName: "Ade Okafor" } : { bank: "GTBank", accountNumber: "", accountName: "" },
      history: DEMO
        ? [
            { id: "h1", fromId: "nyanya", toId: "cbd", when: "Yesterday · 7:10 AM", riders: 4, earned: 4320 },
            { id: "h2", fromId: "cbd", toId: "nyanya", when: "Yesterday · 5:30 PM", riders: 3, earned: 3240 },
            { id: "h3", fromId: "nyanya", toId: "cbd", when: "Tue · 7:10 AM", riders: 4, earned: 4320 },
            { id: "h4", fromId: "cbd", toId: "nyanya", when: "Mon · 5:30 PM", riders: 2, earned: 2160 },
          ]
        : [],
      setPayout: (payout) => set({ payout }),
      online: false,
      balance: DEMO ? 24300 : 0,
      activeTrip: null,
      riders: [],
      started: false,
      setOnline: (online) => set({ online }),
      publish: (t) => {
        const id = makeId("p");
        set({ activeTrip: { ...t, id }, riders: [], started: false });
        return id;
      },
      addRider: (r) => set((s) => (s.activeTrip && s.riders.length < s.activeTrip.seats && !s.riders.some((x) => x.name === r.name) ? { riders: [...s.riders, { ...r, boarded: false, noShow: false }] } : s)),
      board: (code) => {
        const r = get().riders.find((x) => x.code === code && !x.noShow);
        if (!r) return { ok: false, code: "NO_MATCH", message: "That code doesn’t match a rider on this trip. Check the 4 digits and try again." };
        if (r.boarded) return { ok: false, code: "ALREADY_BOARDED", message: `${r.name} is already on board.` };
        set((s) => ({ riders: s.riders.map((x) => (x.name === r.name ? { ...x, boarded: true } : x)) }));
        return { ok: true, name: r.name, seat: r.seat };
      },
      markNoShow: (name) => set((s) => ({ riders: s.riders.map((x) => (x.name === name && !x.boarded ? { ...x, noShow: true } : x)) })),
      startTrip: () => set({ started: true }),
      endTrip: () => {
        const { activeTrip: t, riders } = get();
        // Seats that were booked and prepaid are still paid when the rider doesn't show (see lib/policy.ts).
        const earned = t ? driverShare(t.price) * riders.length : 0;
        const when = t ? `Today · ${t.time}` : "Today";
        set((s) => ({
          activeTrip: null, riders: [], started: false, online: s.online,
          balance: s.balance + earned,
          history: t ? [{ id: t.id, fromId: t.fromId, toId: t.toId, when, riders: riders.length, earned }, ...s.history] : s.history,
        }));
        return earned;
      },
      withdraw: (amount) => {
        if (amount <= 0 || amount > get().balance) return false;
        set((s) => ({ balance: s.balance - amount }));
        return true;
      },
    }),
    { name: "myway.driver", skipHydration: true, version: 2, migrate: (p) => ({ ...(p as object), riders: [], started: false }) as unknown as DriverState },
  ),
);
