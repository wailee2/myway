"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEMO } from "../demo";
import { SEED_NOTIFICATIONS, SEED_TRANSACTIONS } from "../data/misc";
import { getLine } from "../data/bus";
import { getStop, stopName } from "../data/stops";
import { getDriver, getTrip, minutesTo, takenFor } from "../data/trips";
import { addMinutes, dayLabel, formatNaira, makeCode, makeId } from "../format";
import { allInPrice, busQuote, CASH_HOLD, SEAT_LABEL } from "../pricing";
import { POLICY } from "../policy";
import { track, endFlow } from "../analytics";
import { useSession } from "./session";
import { LIVE } from "../api/live";
import { api, ApiError, getToken } from "../api/client";
import { fetchTrip } from "../api/rides";
import { bookingFromApi, topUpFromApi, txFromApi, type ApiBooking, type ApiWallet } from "../api/mappers";
import type { AppNotification, Booking, BookingProgress, BookingResult, Message, PaymentMethod, PendingTopUp, SeatId, Transaction } from "../types";

interface Draft {
  /** What the rider searched for (stop ids). */
  from: string;
  to: string;
  /** 0 = today */
  day: number;
  tripId?: string;
  /** The stops they will actually board and leave at (may differ slightly from what they searched). */
  pickupId?: string;
  dropoffId?: string;
  seat: SeatId;
  lineId?: string;
  busTime?: string;
  busSeats: string[];
  payment: PaymentMethod;
}

export type ActionResult = { ok: true } | { ok: false; message: string };

interface BookingState {
  balance: number;
  transactions: Transaction[];
  pendingTopUps: PendingTopUp[];
  bookings: Booking[];
  messages: Message[];
  notifications: AppNotification[];
  draft: Draft;
  setDraft: (d: Partial<Draft>) => void;
  /** Pulls bookings, wallet balance and history from the backend (no-op without it). */
  sync: () => Promise<void>;
  /** Clears everything tied to the previous person (log out, or a different account logging in). */
  reset: () => void;
  confirmCar: () => Promise<BookingResult>;
  confirmBus: () => BookingResult;
  /** Rider cancels. Refund follows the cancellation policy. */
  cancel: (id: string) => Promise<ActionResult>;
  setProgress: (id: string, p: BookingProgress) => Promise<void>;
  markLate: (id: string, minutes: number) => Promise<void>;
  /** Driver cancelled: automatic refund + notification. */
  driverCancel: (id: string) => Promise<void>;
  /** Rider did not turn up within the waiting time. */
  markNoShow: (id: string) => Promise<void>;
  rate: (id: string, r: { stars: number; tags: string[]; tip: number }) => Promise<ActionResult>;
  sendMessage: (bookingId: string, text: string, from?: Message["from"]) => Promise<void>;
  /** Loads the conversation for a booking from the backend (no-op without it). */
  loadMessages: (bookingId: string) => Promise<void>;
  /** Top-ups stay PENDING until the bank confirms. Never credited on the rider's say-so. Resolves to the top-up id. */
  requestTopUp: (amount: number) => Promise<string>;
  confirmTopUp: (id: string) => Promise<void>;
  cancelTopUp: (id: string) => Promise<void>;
  spend: (amount: number, title: string, icon: Transaction["icon"]) => boolean;
  markAllRead: () => void;
  markRead: (id: string) => void;
}

const now = Date.now();
/** Sample history only when the frontend runs alone; with the backend, everything comes from the server. */
const SEED = DEMO && !LIVE;
const SEED_BOOKINGS: Booking[] = SEED
  ? [
      { id: "b-4821", kind: "car", title: "Nyanya Bridge stop → CBD Terminal", sub: "Today · Middle · Ade O.", time: "07:10", seat: "back-m", code: "4821", total: 1350, payment: "wallet", status: "upcoming", createdAt: now - 2 * 3600e3, updatedAt: now - 2 * 3600e3, dateLabel: "Today", tripId: "t-701", dayOffset: 0, pickupId: "nyanya", dropoffId: "cbd", progress: "assigned" },
      { id: "b-bus1", kind: "bus", title: "Line N1 · Nyanya Bridge → CBD Terminal", sub: "Tomorrow · Seat 4B", time: "07:30", seat: "4B", code: "N1-4B", total: 700, payment: "wallet", status: "upcoming", createdAt: now - 3 * 3600e3, updatedAt: now - 3 * 3600e3, dateLabel: "Tomorrow", lineId: "N1", progress: "assigned" },
      { id: "b-past1", kind: "car", title: "CBD Terminal → Nyanya Bridge stop", sub: "Fri · Back row, behind the driver · Musa I.", time: "17:30", seat: "back-l", code: "0000", total: 1350, payment: "wallet", status: "completed", createdAt: now - 3 * 86400e3, updatedAt: now - 3 * 86400e3, dateLabel: "Fri", tripId: "t-731", dayOffset: 0, pickupId: "cbd", dropoffId: "nyanya", progress: "dropped_off", rating: 5 },
    ]
  : [];

const emptyDraft: Draft = { from: "", to: "", day: 0, seat: "back-m", busSeats: [], payment: "wallet" };

/** Minutes until a car booking's pickup. Infinity in demo mode, where trips are always "upcoming". */
export function minutesUntilPickup(b: Booking, at = Date.now()) {
  if (b.pickupAt) return (b.pickupAt - at) / 60000; // from the backend: the exact pickup moment
  if (DEMO || b.kind !== "car") return Infinity;
  const [h = "0", m = "0"] = b.time.split(":");
  const when = new Date(b.createdAt);
  when.setDate(when.getDate() + (b.dayOffset ?? 0));
  when.setHours(Number(h), Number(m), 0, 0);
  return (when.getTime() - at) / 60000;
}

export const refundsOnCancel = (b: Booking) => minutesUntilPickup(b) >= POLICY.cancelFreeMinutes;

const fail = (code: Extract<BookingResult, { ok: false }>["code"], message: string, shortBy?: number): BookingResult => ({ ok: false, code, message, shortBy });

const note = (icon: AppNotification["icon"], title: string, body: string): AppNotification => ({ id: makeId("n"), icon, title, body, time: "Now", unread: true });

/** Turns a backend error into the typed result the booking screens already understand. */
const apiFail = (e: unknown): BookingResult => {
  if (e instanceof ApiError) {
    const known = ["NO_TRIP", "NO_SELECTION", "SEAT_TAKEN", "INSUFFICIENT_FUNDS", "ID_REQUIRED"] as const;
    const code = (known as readonly string[]).includes(e.code) ? (e.code as (typeof known)[number]) : "UNAVAILABLE";
    return { ok: false, code, message: e.message, shortBy: typeof e.extra.shortBy === "number" ? e.extra.shortBy : undefined };
  }
  return fail("UNAVAILABLE", "Something went wrong. Try again.");
};
const messageOf = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong. Try again.");
/** Rider actions that go to the backend, then pull the new state. */
const post = (path: string, body?: unknown) => api(path, { method: "POST", body: body ?? undefined });

export const useBooking = create<BookingState>()(
  persist(
    (set, get) => ({
      balance: SEED ? 8400 : 0,
      transactions: SEED ? SEED_TRANSACTIONS : [],
      pendingTopUps: [],
      bookings: SEED_BOOKINGS,
      messages: [],
      notifications: SEED ? SEED_NOTIFICATIONS : [],
      draft: emptyDraft,

      setDraft: (d) => set((s) => ({ draft: { ...s.draft, ...d } })),

      sync: async () => {
        if (!LIVE || !getToken()) return;
        try {
          const [bookings, wallet] = await Promise.all([api<ApiBooking[]>("/bookings"), api<ApiWallet>("/wallet")]);
          set({ bookings: bookings.map(bookingFromApi), balance: wallet.balance, transactions: wallet.transactions.map(txFromApi), pendingTopUps: wallet.pending_top_ups.map(topUpFromApi) });
        } catch { /* offline or signed out: keep showing what we have */ }
      },
      reset: () => set({ balance: SEED ? 8400 : 0, transactions: SEED ? SEED_TRANSACTIONS : [], pendingTopUps: [], bookings: SEED_BOOKINGS, messages: [], notifications: SEED ? SEED_NOTIFICATIONS : [], draft: emptyDraft }),

      confirmCar: async () => {
        if (LIVE) {
          const { draft } = get();
          if (!draft.tripId) return fail("NO_TRIP", "That ride is no longer available. Choose another ride.");
          if (!draft.pickupId || !draft.dropoffId) return fail("NO_SELECTION", "Choose your pickup and drop-off stops first.");
          try {
            const b = await api<ApiBooking>("/bookings", { body: { trip_id: draft.tripId, seat: draft.seat, pickup_stop: draft.pickupId, dropoff_stop: draft.dropoffId, payment: draft.payment } });
            await get().sync();
            const booking = get().bookings.find((x) => x.id === b.id);
            if (booking) set((s) => ({ notifications: [note("car", "You’re booked", `${booking.title} · ${booking.dateLabel} · ${booking.time}`), ...s.notifications] }));
            track("booked", { kind: "car", ms: endFlow() ?? 0, payment: draft.payment });
            return { ok: true, id: b.id };
          } catch (e) {
            // Someone took the seat: reload the trip so the seat picker shows it as taken.
            if (e instanceof ApiError && e.code === "SEAT_TAKEN") void fetchTrip(draft.tripId).catch(() => {});
            return apiFail(e);
          }
        }
        const { draft, balance, bookings } = get();
        const trip = draft.tripId ? getTrip(draft.tripId) : undefined;
        if (!trip) return fail("NO_TRIP", "That ride is no longer available. Choose another ride.");
        if (!draft.pickupId || !draft.dropoffId) return fail("NO_SELECTION", "Choose your pickup and drop-off stops first.");
        const session = useSession.getState();
        if (session.role === "rider" && !session.idVerified) return fail("ID_REQUIRED", "Confirm your ID to reserve your first seat.");
        // Seat integrity (client stand-in for the backend's atomic seat hold).
        const own = bookings.filter((b) => b.tripId === trip.id && b.status === "upcoming" && (b.dayOffset ?? 0) === draft.day).map((b) => b.seat as SeatId);
        if (takenFor(trip, draft.day, own).includes(draft.seat)) return fail("SEAT_TAKEN", "Someone just reserved that seat. Choose another seat.");

        const total = allInPrice(trip, draft.seat, draft.pickupId, draft.dropoffId);
        const charge = draft.payment === "wallet" ? total : draft.payment === "cash" ? CASH_HOLD : 0;
        if (charge > balance) return fail("INSUFFICIENT_FUNDS", `Your wallet is ${formatNaira(charge - balance)} short.`, charge - balance);

        const driver = getDriver(trip.driverId);
        const id = makeId("b");
        const at = Date.now();
        const label = dayLabel(draft.day);
        const booking: Booking = {
          id, kind: "car", title: `${stopName(draft.pickupId)} → ${stopName(draft.dropoffId)}`,
          sub: `${label} · ${SEAT_LABEL[draft.seat]} · ${driver.name.split(" ")[0]} ${driver.name.split(" ")[1]?.[0] ?? ""}.`,
          time: addMinutes(trip.depart, minutesTo(trip, draft.pickupId)), seat: draft.seat, code: makeCode(4), total, payment: draft.payment,
          status: "upcoming", createdAt: at, updatedAt: at, dateLabel: label, tripId: trip.id, dayOffset: draft.day,
          pickupId: draft.pickupId, dropoffId: draft.dropoffId, progress: "assigned",
        };
        const tx: Transaction[] = charge > 0 ? [{ id: makeId("x"), title: draft.payment === "cash" ? "Seat hold · cash trip" : `Ride to ${stopName(draft.dropoffId)}`, sub: label, amount: -charge, icon: "car" }] : [];
        set((s) => ({ balance: s.balance - charge, bookings: [booking, ...s.bookings], transactions: [...tx, ...s.transactions], notifications: [note("car", "You’re booked", `${booking.title} · ${label} · ${booking.time}`), ...s.notifications] }));
        track("booked", { kind: "car", ms: endFlow() ?? 0, payment: draft.payment });
        return { ok: true, id };
      },

      confirmBus: () => {
        if (LIVE) return fail("UNAVAILABLE", "Bus tickets aren’t connected to the server yet. Car rides are.");
        const { draft, balance } = get();
        const line = draft.lineId ? getLine(draft.lineId) : undefined;
        if (!line || !draft.busTime || draft.busSeats.length === 0) return fail("NO_SELECTION", "Choose a departure and at least one seat.");
        const session = useSession.getState();
        if (session.role === "rider" && !session.idVerified) return fail("ID_REQUIRED", "Confirm your ID to reserve your first seat.");
        const total = busQuote(line.price, draft.busSeats.length).total;
        const charge = draft.payment === "wallet" ? total : 0;
        if (charge > balance) return fail("INSUFFICIENT_FUNDS", `Your wallet is ${formatNaira(charge - balance)} short.`, charge - balance);
        const id = makeId("b");
        const seat = draft.busSeats.join(", ");
        const at = Date.now();
        const booking: Booking = {
          id, kind: "bus", title: `Line ${line.id} · ${line.from} → ${line.to}`, sub: `Today · Seat ${seat}`, time: draft.busTime, seat, code: `${line.id}-${draft.busSeats[0]}`,
          total, payment: draft.payment, status: "upcoming", createdAt: at, updatedAt: at, dateLabel: "Today", lineId: line.id, progress: "assigned",
        };
        const tx: Transaction[] = charge > 0 ? [{ id: makeId("x"), title: `Bus ${line.id} ticket`, sub: "Today", amount: -charge, icon: "bus" }] : [];
        set((s) => ({ balance: s.balance - charge, bookings: [booking, ...s.bookings], transactions: [...tx, ...s.transactions] }));
        track("booked", { kind: "bus", ms: endFlow() ?? 0, payment: draft.payment });
        return { ok: true, id };
      },

      cancel: async (id) => {
        if (LIVE && get().bookings.find((x) => x.id === id)?.kind === "car") {
          try {
            await post(`/bookings/${id}/cancel`);
            track("cancelled", { by: "rider" });
            await get().sync();
            return { ok: true };
          } catch (e) { return { ok: false, message: messageOf(e) }; }
        }
        set((s) => {
          const b = s.bookings.find((x) => x.id === id);
          if (!b || b.status !== "upcoming") return s;
          const refund = b.payment === "wallet" && (b.kind === "bus" || refundsOnCancel(b)) ? b.total : 0;
          track("cancelled", { by: "rider", refund: refund > 0 });
          return {
            balance: s.balance + refund,
            bookings: s.bookings.map((x) => (x.id === id ? { ...x, status: "cancelled" as const, cancelledBy: "rider" as const, updatedAt: Date.now() } : x)),
            transactions: refund ? [{ id: makeId("x"), title: "Refund · cancelled seat", sub: "Today", amount: refund, icon: "card" as const }, ...s.transactions] : s.transactions,
          };
        });
        return { ok: true };
      },

      setProgress: async (id, progress) => {
        if (LIVE) { try { await post(`/dev/bookings/${id}/progress`, { progress }); } catch { /* finished bookings can't move */ } return get().sync(); }
        set((s) => ({
          bookings: s.bookings.map((b) => (b.id === id ? { ...b, progress, lateMinutes: undefined, updatedAt: Date.now(), status: progress === "dropped_off" ? ("completed" as const) : b.status } : b)),
        }));
      },

      markLate: async (id, lateMinutes) => {
        if (LIVE) { try { await post(`/dev/bookings/${id}/late`, { minutes: lateMinutes }); } catch { /* ignore */ } return get().sync(); }
        set((s) => ({
          bookings: s.bookings.map((b) => (b.id === id ? { ...b, lateMinutes, updatedAt: Date.now() } : b)),
          notifications: [note("alert", `Your driver is running ${lateMinutes} minutes late`, "You can message the driver or call from your booking."), ...s.notifications],
        }));
      },

      driverCancel: async (id) => {
        if (LIVE) { try { await post(`/dev/bookings/${id}/driver-cancel`); } catch { /* ignore */ } return get().sync(); }
        set((s) => {
          const b = s.bookings.find((x) => x.id === id);
          if (!b || b.status !== "upcoming") return s;
          const refund = b.payment === "cash" ? 0 : b.total; // cash riders only had the hold, handled below
          const hold = b.payment === "cash" ? CASH_HOLD : 0;
          track("cancelled", { by: "driver" });
          return {
            balance: s.balance + refund + hold,
            bookings: s.bookings.map((x) => (x.id === id ? { ...x, status: "cancelled" as const, cancelledBy: "driver" as const, updatedAt: Date.now() } : x)),
            transactions: refund + hold ? [{ id: makeId("x"), title: "Refund · driver cancelled", sub: "Today", amount: refund + hold, icon: "card" as const }, ...s.transactions] : s.transactions,
            notifications: [note("alert", "Your driver cancelled", `${formatNaira(refund + hold)} is back in your wallet. Tap to see other rides.`), ...s.notifications],
          };
        });
      },

      markNoShow: async (id) => {
        if (LIVE) { try { await post(`/dev/bookings/${id}/no-show`); } catch { /* ignore */ } return get().sync(); }
        set((s) => {
          const b = s.bookings.find((x) => x.id === id);
          if (!b || b.status !== "upcoming") return s;
          track("cancelled", { by: "no_show" });
          return {
            bookings: s.bookings.map((x) => (x.id === id ? { ...x, status: "cancelled" as const, cancelledBy: "no_show" as const, updatedAt: Date.now() } : x)),
            notifications: [note("alert", "Your seat was released", "The driver waited at the stop and left. The fare is not refunded."), ...s.notifications],
          };
        });
      },

      rate: async (id, { stars, tags, tip }) => {
        if (LIVE) {
          try { await post(`/bookings/${id}/rate`, { stars, tags, tip }); await get().sync(); return { ok: true }; } catch (e) { return { ok: false, message: messageOf(e) }; }
        }
        set((s) => {
          const canTip = tip > 0 && tip <= s.balance;
          return {
            balance: s.balance - (canTip ? tip : 0),
            transactions: canTip ? [{ id: makeId("x"), title: "Tip for your driver", sub: "Today", amount: -tip, icon: "car" as const }, ...s.transactions] : s.transactions,
            bookings: s.bookings.map((b) => (b.id === id ? { ...b, rating: stars, ratingTags: tags, tip: canTip ? tip : undefined, status: "completed" as const, updatedAt: Date.now() } : b)),
          };
        });
        return { ok: true };
      },

      loadMessages: async (bookingId) => {
        if (!LIVE) return;
        try {
          const rows = await api<{ id: string; from: Message["from"]; text: string; at: string }[]>(`/bookings/${bookingId}/messages`);
          set((s) => ({ messages: [...s.messages.filter((m) => m.bookingId !== bookingId), ...rows.map((m) => ({ id: m.id, bookingId, from: m.from, text: m.text, at: Date.parse(m.at) }))] }));
        } catch { /* messaging closed or offline */ }
      },
      sendMessage: async (bookingId, text, from = "rider") => {
        if (LIVE) { try { await post(`/bookings/${bookingId}/messages`, { text }); } catch { /* closed */ } return get().loadMessages(bookingId); }
        set((s) => ({ messages: [...s.messages, { id: makeId("m"), bookingId, from, text, at: Date.now() }] }));
      },

      requestTopUp: async (amount) => {
        if (LIVE) {
          const t = await api<{ id: string }>("/wallet/top-ups", { body: { amount } });
          await get().sync();
          return t.id;
        }
        const id = makeId("tu");
        set((s) => ({ pendingTopUps: [{ id, amount, createdAt: Date.now() }, ...s.pendingTopUps] }));
        return id;
      },
      cancelTopUp: async (id) => {
        if (LIVE) { try { await api(`/wallet/top-ups/${id}`, { method: "DELETE" }); } catch { /* already gone */ } return get().sync(); }
        set((s) => ({ pendingTopUps: s.pendingTopUps.filter((x) => x.id !== id) }));
      },
      confirmTopUp: async (id) => {
        if (LIVE) { try { await post(`/dev/top-ups/${id}/confirm`); } catch { /* demo endpoint only */ } return get().sync(); }
        set((s) => {
          const p = s.pendingTopUps.find((x) => x.id === id);
          if (!p) return s;
          return {
            pendingTopUps: s.pendingTopUps.filter((x) => x.id !== id),
            balance: s.balance + p.amount,
            transactions: [{ id: makeId("x"), title: "Top up · Bank transfer", sub: "Today", amount: p.amount, icon: "bank" as const }, ...s.transactions],
            notifications: [note("wallet", `Wallet credited ${formatNaira(p.amount)}`, "Bank transfer received."), ...s.notifications],
          };
        });
      },

      spend: (amount, title, icon) => {
        if (LIVE) return false; // purchases other than rides aren't in the backend yet
        if (amount > get().balance) return false;
        set((s) => ({ balance: s.balance - amount, transactions: [{ id: makeId("x"), title, sub: "Today", amount: -amount, icon }, ...s.transactions] }));
        return true;
      },
      markRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)) })),
      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, unread: false })) })),
    }),
    {
      name: "myway.booking",
      skipHydration: true,
      version: 2,
      migrate: (persisted, version) => {
        const s = persisted as { bookings?: Record<string, unknown>[]; draft?: unknown } & Record<string, unknown>;
        if (version < 2) {
          const map: Record<string, BookingProgress> = { confirmed: "assigned", arriving: "arriving", onboard: "boarded", arrived: "dropped_off" };
          s.bookings = (s.bookings ?? []).map((b) => {
            const at = Number(b.createdAt) || Date.now();
            const trip = typeof b.tripId === "string" ? getTrip(b.tripId) : undefined;
            const first = trip ? getStop(trip.routeId === "r-nyanya-cbd" ? "nyanya" : "") : undefined;
            return {
              ...b,
              progress: map[String(b.progress)] ?? "assigned",
              updatedAt: at,
              dateLabel: String(b.sub ?? "").split(" · ")[0] || "Today",
              dayOffset: 0,
              pickupId: b.pickupId ?? first?.id,
              dropoffId: b.dropoffId ?? (trip?.routeId === "r-nyanya-cbd" ? "cbd" : undefined),
            };
          });
          s.draft = emptyDraft;
          s.pendingTopUps = [];
          s.messages = [];
        }
        return s as unknown as BookingState;
      },
    },
  ),
);

/** A car trip in progress: the driver is on the way, arriving, or the rider is on board. Safety stays one tap away. */
export const isActiveTrip = (b: Booking) => b.kind === "car" && b.status === "upcoming" && (b.progress === "on_the_way" || b.progress === "arriving" || b.progress === "boarded");

// A different person (or nobody) is now signed in: drop the previous account's bookings, balance and chats.
useSession.subscribe((now, before) => {
  if (LIVE && (now.phone !== before.phone || (before.onboarded && !now.onboarded))) useBooking.getState().reset();
});
