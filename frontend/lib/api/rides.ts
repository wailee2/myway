import { DEMO } from "../demo";
import { matchTrips, type RideMatch } from "../data/trips";
import { getStop } from "../data/stops";
import type { Booking, SeatId, Stop } from "../types";
import { api } from "./client";
import { LIVE } from "./live";
import { lagosHHMM, rememberTrip, type ApiRideMatch, type ApiTrip } from "./mappers";

/** GET /rides?from=&to=&day= (or the on-device matcher when the backend is off). */
export interface SearchParams { from: string; to: string; day: number; attempt?: number }

/** Seats this rider already holds, so results never offer a seat they own. */
export function ownSeatMap(bookings: Booking[], day: number) {
  const out: Record<string, SeatId[]> = {};
  for (const b of bookings) {
    if (b.kind !== "car" || b.status !== "upcoming" || !b.tripId || (b.dayOffset ?? 0) !== day) continue;
    (out[b.tripId] ??= []).push(b.seat as SeatId);
  }
  return out;
}

export async function searchRides({ from, to, day, attempt = 0 }: SearchParams, bookings: Booking[]): Promise<RideMatch[]> {
  if (LIVE) {
    const res = await api<{ results: ApiRideMatch[] }>(`/rides?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&day=${day}`);
    return res.results.map((r): RideMatch => {
      const { trip } = rememberTrip(r.trip);
      return {
        trip, pickup: getStop(r.pickup.id) as Stop, dropoff: getStop(r.dropoff.id) as Stop,
        pickupTime: lagosHHMM(r.pickup.time), dropoffTime: lagosHHMM(r.dropoff.time),
        pickupOffsetM: r.pickup.offset_m, dropoffOffsetM: r.dropoff.offset_m,
        seatsLeft: r.seats_left, taken: trip.taken,
      };
    }).filter((m) => m.pickup && m.dropoff);
  }
  if (DEMO) await new Promise((r) => window.setTimeout(r, 450));
  // Demo: open /app/search?demo=error to see the error state. "Try again" succeeds.
  if (DEMO && attempt === 0 && new URLSearchParams(window.location.search).get("demo") === "error") throw new Error("SEARCH_FAILED");
  return matchTrips(from, to, day, ownSeatMap(bookings, day));
}

/** GET /trips/{id}: used when a trip page is opened directly (refresh, shared link). */
export async function fetchTrip(id: string) {
  return rememberTrip(await api<ApiTrip>(`/trips/${encodeURIComponent(id)}`));
}
