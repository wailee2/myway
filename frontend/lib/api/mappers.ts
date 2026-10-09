import { getStop, stopName } from "../data/stops";
import { registerLiveTrip } from "../data/trips";
import { initials } from "../format";
import { SEAT_LABEL } from "../pricing";
import type { Booking, BookingProgress, CancelledBy, CarTrip, Driver, PaymentMethod, PendingTopUp, SeatId, Transaction } from "../types";

/* ---------- What the backend sends (snake_case) ---------- */
export interface ApiTrip {
  id: string; route_id: string; departs_at: string; price: number; women_only: boolean; taken: string[];
  driver: { id: string; name: string; id_verified: boolean; rating?: number | null; trips?: number };
  vehicle: { plate: string; make: string; color: string };
}
export interface ApiBooking {
  id: string; trip_id: string; seat: string; pickup_stop: string; dropoff_stop: string; pickup_time: string; dropoff_time: string;
  price_paid: number; payment: PaymentMethod; status: "upcoming" | "completed" | "cancelled"; progress: BookingProgress;
  cancelled_by: CancelledBy | null; late_minutes: number | null; rating: number | null; tip: number | null;
  created_at: string; updated_at: string; boarding_code?: string;
  driver: { id: string; name: string; plate: string; make: string; color: string; id_verified?: boolean; rating?: number | null; trips?: number };
  route_id: string; departs_at: string; trip_price: number; women_only: boolean; taken: string[];
}
export interface ApiWallet {
  balance: number;
  transactions: { id: string; amount: number; kind: string; note: string; at: string }[];
  pending_top_ups: { id: string; amount: number; created_at: string }[];
}
export interface ApiRideMatch {
  trip: ApiTrip;
  pickup: { id: string; offset_m: number; time: string };
  dropoff: { id: string; offset_m: number; time: string };
  seats_left: number;
}

/* ---------- Times: the app speaks Abuja time, whatever the phone's clock says ---------- */
const LAGOS = "Africa/Lagos";
const hm = new Intl.DateTimeFormat("en-GB", { timeZone: LAGOS, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: LAGOS, year: "numeric", month: "2-digit", day: "2-digit" });
const nice = new Intl.DateTimeFormat("en-GB", { timeZone: LAGOS, weekday: "short", day: "numeric", month: "short" });

/** "2026-10-09T06:10:00Z" -> "07:10" */
export const lagosHHMM = (iso: string) => hm.format(new Date(iso));

const dayNumber = (d: Date) => { const [y, m, dd] = ymd.format(d).split("-").map(Number); return Date.UTC(y!, m! - 1, dd!) / 86_400_000; };
/** Whole Abuja calendar days from today to this moment (0 = today, negative = past). */
export const lagosDayOffset = (iso: string, now = new Date()) => dayNumber(new Date(iso)) - dayNumber(now);
/** "Today", "Tomorrow", or "Fri 9 Oct". */
export const dateLabelFor = (iso: string, now = new Date()) => {
  const o = lagosDayOffset(iso, now);
  return o === 0 ? "Today" : o === 1 ? "Tomorrow" : nice.format(new Date(iso)).replace(",", "");
};

/* ---------- Trips and drivers ---------- */
export function tripFromApi(t: ApiTrip): { trip: CarTrip; driver: Driver } {
  const trip: CarTrip = { id: t.id, routeId: t.route_id, depart: lagosHHMM(t.departs_at), price: t.price, taken: t.taken as SeatId[], driverId: t.driver.id, womenOnly: t.women_only, live: true };
  const driver: Driver = { id: t.driver.id, name: t.driver.name, initials: initials(t.driver.name), rating: t.driver.rating ?? null, trips: t.driver.trips ?? 0, plate: t.vehicle.plate, make: t.vehicle.make, color: t.vehicle.color, verified: t.driver.id_verified };
  return { trip, driver };
}

/** Maps and remembers a trip so getTrip()/getDriver() can find it everywhere. */
export function rememberTrip(t: ApiTrip) {
  const m = tripFromApi(t);
  registerLiveTrip(m.trip, m.driver);
  return m;
}

/* ---------- Bookings ---------- */
export function bookingFromApi(b: ApiBooking): Booking {
  // Every booking carries enough of its trip to be shown after a refresh, so remember it.
  registerLiveTrip(
    { id: b.trip_id, routeId: b.route_id, depart: lagosHHMM(b.departs_at), price: b.trip_price, taken: b.taken as SeatId[], driverId: b.driver.id, womenOnly: b.women_only, live: true },
    { id: b.driver.id, name: b.driver.name, initials: initials(b.driver.name), rating: b.driver.rating ?? null, trips: b.driver.trips ?? 0, plate: b.driver.plate, make: b.driver.make, color: b.driver.color, verified: b.driver.id_verified ?? true },
  );
  const label = dateLabelFor(b.pickup_time);
  const first = b.driver.name.split(" ");
  return {
    id: b.id, kind: "car", title: `${stopName(b.pickup_stop)} → ${stopName(b.dropoff_stop)}`,
    sub: `${label} · ${SEAT_LABEL[b.seat as SeatId] ?? b.seat} · ${first[0]} ${first[1]?.[0] ?? ""}.`,
    time: lagosHHMM(b.pickup_time), seat: b.seat, code: b.boarding_code ?? "", total: b.price_paid, payment: b.payment, status: b.status,
    createdAt: Date.parse(b.created_at), updatedAt: Date.parse(b.updated_at), dateLabel: label,
    tripId: b.trip_id, dayOffset: Math.max(0, lagosDayOffset(b.pickup_time)), pickupId: getStop(b.pickup_stop) ? b.pickup_stop : undefined, dropoffId: getStop(b.dropoff_stop) ? b.dropoff_stop : undefined,
    progress: b.progress, cancelledBy: b.cancelled_by ?? undefined, lateMinutes: b.late_minutes ?? undefined,
    rating: b.rating ?? undefined, tip: b.tip || undefined, pickupAt: Date.parse(b.pickup_time),
  };
}

/* ---------- Wallet ---------- */
const TX_ICON: Record<string, Transaction["icon"]> = { top_up: "bank", payout: "bank", ride: "car", hold: "car", tip: "car", earning: "car", refund: "card", fee: "card" };
export const txFromApi = (t: ApiWallet["transactions"][number]): Transaction => ({ id: t.id, title: t.note || t.kind, sub: dateLabelFor(t.at), amount: t.amount, icon: TX_ICON[t.kind] ?? "card" });
export const topUpFromApi = (t: ApiWallet["pending_top_ups"][number]): PendingTopUp => ({ id: t.id, amount: t.amount, createdAt: Date.parse(t.created_at) });
