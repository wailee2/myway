import type { SeatId } from "./types";

export const FRONT_SEAT_PREMIUM = 300;
export const BOOKING_FEE = 100;
export const FUEL_ADJUSTMENT = 50; // illustrative; in production this derives from the pump price
export const CASH_HOLD = 200;

export function seatFare(base: number, seat: SeatId) {
  return seat === "front" ? base + FRONT_SEAT_PREMIUM : base;
}

export function quote(base: number, seat: SeatId) {
  const fare = seatFare(base, seat);
  return { fare, fee: BOOKING_FEE, fuel: FUEL_ADJUSTMENT, total: fare + BOOKING_FEE + FUEL_ADJUSTMENT };
}

export function busQuote(price: number, seats: number) {
  const fare = price * seats;
  return { fare, fee: 0, fuel: 0, total: fare };
}

export const SEAT_LABEL: Record<SeatId, string> = {
  front: "Front seat",
  "back-l": "Back left",
  "back-m": "Back middle",
  "back-r": "Back right",
};
