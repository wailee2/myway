import { DEMO, DEMO_FUEL_PRICE_PER_LITRE } from "./demo";
import { POLICY } from "./policy";
import { getRoute } from "./data/stops";
import type { CarTrip, SeatId } from "./types";

export const FRONT_SEAT_PREMIUM = POLICY.frontSeatPremium;
export const CASH_HOLD = POLICY.cashHold;

/**
 * The ONE price a rider sees, from search to receipt: fare + service + fuel, all included.
 * Trip-level fares are built. Segment pricing is behind POLICY.fareModel and off until the Gate decides it.
 */
export function allInPrice(trip: CarTrip, seat: SeatId, pickupId?: string, dropoffId?: string) {
  let base = trip.price;
  if (POLICY.fareModel === "segment" && pickupId && dropoffId) {
    const stops = getRoute(trip.routeId)?.stops ?? [];
    const a = stops.find((s) => s.stopId === pickupId);
    const b = stops.find((s) => s.stopId === dropoffId);
    const total = stops[stops.length - 1]?.km ?? 0;
    if (a && b && total > 0) base = Math.max(Math.round(trip.price * 0.5 / 50) * 50, Math.round((trip.price * (b.km - a.km)) / total / 50) * 50);
  }
  return seat === "front" ? base + FRONT_SEAT_PREMIUM : base;
}

export const busQuote = (price: number, seats: number) => ({ total: price * seats });

/** What the driver keeps from a fare after MYWAY's commission. */
export const driverShare = (fare: number) => Math.round(fare * (1 - POLICY.commissionRate));

/** Back-seat fare guide for a route, from distance and time. Rates are samples until a live fuel feed exists. */
export function fareGuide(km: number, minutes: number) {
  const fuel = km * 0.1 * DEMO_FUEL_PRICE_PER_LITRE;
  const time = minutes * 8;
  const labour = km * 30;
  const perSeat = ((fuel + time + labour) * 1.25) / 4;
  const mid = Math.round(perSeat / 50) * 50;
  return { low: Math.max(500, mid - 100), high: mid + 150, sample: DEMO };
}

export const SEAT_LABEL: Record<SeatId, string> = {
  front: "Front seat",
  "back-l": "Behind driver",
  "back-m": "Middle",
  "back-r": "Right window",
};

/** Longer label used on the seat diagram and receipts. */
export const SEAT_LONG: Record<SeatId, string> = {
  front: "Front seat, beside the driver",
  "back-l": "Back row, behind the driver",
  "back-m": "Back row, middle",
  "back-r": "Back row, right window",
};
