"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SEED_NOTIFICATIONS, SEED_TRANSACTIONS } from "../data/misc";
import { getLine } from "../data/bus";
import { getDriver, getTrip } from "../data/trips";
import { stopName } from "../data/stops";
import { busQuote, CASH_HOLD, quote, SEAT_LABEL } from "../pricing";
import { formatNaira, makeCode, makeId } from "../format";
import type { AppNotification, Booking, BookingProgress, PaymentMethod, SeatId, Transaction } from "../types";

interface Draft {
  from: string;
  to: string;
  tripId?: string;
  seat: SeatId;
  lineId?: string;
  busTime?: string;
  busSeats: string[];
  payment: PaymentMethod;
}

type Result = { ok: true; id: string } | { ok: false; reason: string };

interface BookingState {
  balance: number;
  transactions: Transaction[];
  bookings: Booking[];
  notifications: AppNotification[];
  draft: Draft;
  setDraft: (d: Partial<Draft>) => void;
  toggleBusSeat: (seat: string) => void;
  confirmCar: () => Result;
  confirmBus: () => Result;
  cancel: (id: string) => void;
  setProgress: (id: string, p: BookingProgress) => void;
  rate: (id: string, stars: number) => void;
  topUp: (amount: number) => void;
  spend: (amount: number, title: string, icon: Transaction["icon"]) => boolean;
  markAllRead: () => void;
}

const SEED_BOOKINGS: Booking[] = [
  { id: "b-4821", kind: "car", title: "Nyanya Bridge stop → CBD Terminal", sub: "Today · Back middle seat · Ade O.", time: "7:10", seat: "back-m", code: "4821", total: 1350, payment: "wallet", status: "upcoming", createdAt: 1, tripId: "t-701", progress: "confirmed" },
  { id: "b-bus1", kind: "bus", title: "Line N1 · Nyanya → CBD", sub: "Tomorrow · Seat 4B", time: "7:30", seat: "4B", code: "N1-4B", total: 700, payment: "wallet", status: "upcoming", createdAt: 2, lineId: "N1", progress: "confirmed" },
  { id: "b-past1", kind: "car", title: "CBD Terminal → Nyanya Bridge stop", sub: "Fri · Rated 5 stars", time: "6:10", seat: "back-l", code: "0000", total: 1350, payment: "wallet", status: "completed", createdAt: 0, tripId: "t-701", progress: "arrived", rating: 5 },
];

const emptyDraft: Draft = { from: "nyanya", to: "cbd", seat: "back-m", busSeats: [], payment: "wallet" };

export const useBooking = create<BookingState>()(
  persist(
    (set, get) => ({
      balance: 8400,
      transactions: SEED_TRANSACTIONS,
      bookings: SEED_BOOKINGS,
      notifications: SEED_NOTIFICATIONS,
      draft: emptyDraft,

      setDraft: (d) => set((s) => ({ draft: { ...s.draft, ...d } })),
      toggleBusSeat: (seat) =>
        set((s) => ({
          draft: {
            ...s.draft,
            busSeats: s.draft.busSeats.includes(seat) ? s.draft.busSeats.filter((x) => x !== seat) : [...s.draft.busSeats, seat].slice(-4),
          },
        })),

      confirmCar: () => {
        const { draft, balance } = get();
        const trip = draft.tripId ? getTrip(draft.tripId) : undefined;
        if (!trip) return { ok: false, reason: "Pick a trip first." };
        const q = quote(trip.price, draft.seat);
        const charge = draft.payment === "wallet" ? q.total : draft.payment === "cash" ? CASH_HOLD : 0;
        if (charge > balance) return { ok: false, reason: `Your wallet is ${formatNaira(charge - balance)} short. Top up or pick another way to pay.` };
        const driver = getDriver(trip.driverId);
        const id = makeId("b");
        const booking: Booking = {
          id, kind: "car", title: `${stopName(trip.fromId)} → ${stopName(trip.toId)}`, sub: `Today · ${SEAT_LABEL[draft.seat]} · ${driver.name.split(" ")[0]} ${driver.name.split(" ")[1]![0]}.`,
          time: trip.depart, seat: draft.seat, code: makeCode(4), total: q.total, payment: draft.payment, status: "upcoming", createdAt: Date.now(), tripId: trip.id, progress: "confirmed",
        };
        const tx: Transaction[] = charge > 0 ? [{ id: makeId("x"), title: draft.payment === "cash" ? "Seat hold · cash trip" : `Trip to ${stopName(trip.toId)}`, sub: "Today", amount: -charge, icon: "car" }] : [];
        set((s) => ({ balance: s.balance - charge, bookings: [booking, ...s.bookings], transactions: [...tx, ...s.transactions] }));
        return { ok: true, id };
      },

      confirmBus: () => {
        const { draft, balance } = get();
        const line = draft.lineId ? getLine(draft.lineId) : undefined;
        if (!line || !draft.busTime || draft.busSeats.length === 0) return { ok: false, reason: "Choose a departure and at least one seat." };
        const q = busQuote(line.price, draft.busSeats.length);
        const charge = draft.payment === "wallet" ? q.total : 0;
        if (charge > balance) return { ok: false, reason: "Your wallet balance is too low for this ticket. Top up or pick another way to pay." };
        const id = makeId("b");
        const seat = draft.busSeats.join(", ");
        const booking: Booking = {
          id, kind: "bus", title: `Line ${line.id} · ${line.from} → ${line.to}`, sub: `Today · Seat ${seat}`, time: draft.busTime, seat, code: `${line.id}-${draft.busSeats[0]}`,
          total: q.total, payment: draft.payment, status: "upcoming", createdAt: Date.now(), lineId: line.id, progress: "confirmed",
        };
        const tx: Transaction[] = charge > 0 ? [{ id: makeId("x"), title: `Bus ${line.id} ticket`, sub: "Today", amount: -charge, icon: "bus" }] : [];
        set((s) => ({ balance: s.balance - charge, bookings: [booking, ...s.bookings], transactions: [...tx, ...s.transactions] }));
        return { ok: true, id };
      },

      cancel: (id) =>
        set((s) => {
          const b = s.bookings.find((x) => x.id === id);
          if (!b || b.status !== "upcoming") return s;
          const refund = b.payment === "wallet" ? b.total : 0;
          return {
            balance: s.balance + refund,
            bookings: s.bookings.map((x) => (x.id === id ? { ...x, status: "cancelled" as const } : x)),
            transactions: refund ? [{ id: makeId("x"), title: "Refund · cancelled seat", sub: "Today", amount: refund, icon: "card" as const }, ...s.transactions] : s.transactions,
          };
        }),

      setProgress: (id, progress) => set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, progress } : b)) })),
      rate: (id, stars) => set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, rating: stars, status: "completed" as const, sub: `${b.sub.split(" · ")[0]} · Rated ${stars} stars` } : b)) })),
      topUp: (amount) => set((s) => ({ balance: s.balance + amount, transactions: [{ id: makeId("x"), title: "Top up · Bank transfer", sub: "Today", amount, icon: "bank" as const }, ...s.transactions] })),
      spend: (amount, title, icon) => {
        if (amount > get().balance) return false;
        set((s) => ({ balance: s.balance - amount, transactions: [{ id: makeId("x"), title, sub: "Today", amount: -amount, icon }, ...s.transactions] }));
        return true;
      },
      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, unread: false })) })),
    }),
    { name: "myway.booking", skipHydration: true, version: 1 },
  ),
);
