import { DEMO_CO_RIDERS } from "../demo";
import { distanceM } from "../geo";
import { addMinutes } from "../format";
import { POLICY } from "../policy";
import type { CarTrip, Driver, SeatId, Stop } from "../types";
import { getRoute, getStop } from "./stops";

export const DRIVERS: Driver[] = [
  { id: "d1", name: "Ade Okafor", initials: "AO", rating: 4.9, trips: 312, plate: "ABJ 482 KJ", make: "Toyota Corolla", color: "White", verified: true },
  { id: "d2", name: "Chioma Eze", initials: "CE", rating: 4.8, trips: 204, plate: "ABJ 190 LM", make: "Honda Accord", color: "Silver", verified: true },
  { id: "d3", name: "Musa Ibrahim", initials: "MI", rating: 4.9, trips: 421, plate: "ABJ 733 RT", make: "Toyota Camry", color: "Black", verified: true },
  { id: "d4", name: "Ngozi Obi", initials: "NO", rating: 4.7, trips: 98, plate: "ABJ 215 QW", make: "Kia Rio", color: "White", verified: true },
];

/** SEED DATA. `price` is the all-in back-seat fare; riders never see a fee or fuel line. */
export const TRIPS: CarTrip[] = [
  { id: "t-701", routeId: "r-nyanya-cbd", depart: "07:10", price: 1350, taken: ["back-l", "back-r"], driverId: "d1" },
  { id: "t-702", routeId: "r-nyanya-cbd", depart: "07:25", price: 1350, taken: ["front", "back-l", "back-m"], driverId: "d2", womenOnly: true },
  { id: "t-703", routeId: "r-nyanya-cbd", depart: "07:40", price: 1250, taken: ["back-r"], driverId: "d3" },
  { id: "t-704", routeId: "r-nyanya-jabi", depart: "07:15", price: 1450, taken: ["back-m"], driverId: "d4" },
  { id: "t-705", routeId: "r-nyanya-jabi", depart: "07:50", price: 1450, taken: ["front", "back-l"], driverId: "d1" },
  { id: "t-711", routeId: "r-kubwa-wuse", depart: "07:30", price: 1650, taken: ["front"], driverId: "d3" },
  { id: "t-712", routeId: "r-kubwa-wuse", depart: "08:00", price: 1650, taken: [], driverId: "d4", womenOnly: true },
  { id: "t-713", routeId: "r-gwarinpa-wuse", depart: "07:20", price: 1050, taken: ["back-r"], driverId: "d2" },
  { id: "t-714", routeId: "r-gwarinpa-wuse", depart: "08:05", price: 1050, taken: [], driverId: "d3" },
  { id: "t-721", routeId: "r-lugbe-garki", depart: "07:20", price: 1050, taken: ["back-l", "back-m"], driverId: "d1" },
  { id: "t-722", routeId: "r-gwagwalada-cbd", depart: "06:40", price: 1950, taken: ["front", "back-r"], driverId: "d2" },
  { id: "t-731", routeId: "r-cbd-nyanya", depart: "17:30", price: 1350, taken: ["back-m"], driverId: "d3" },
  { id: "t-732", routeId: "r-cbd-nyanya", depart: "18:00", price: 1350, taken: [], driverId: "d1" },
];

/** Trips and drivers loaded from the backend (search results, bookings, trip pages). Looked up by getTrip/getDriver. */
const LIVE_TRIPS = new Map<string, CarTrip>();
const LIVE_DRIVERS = new Map<string, Driver>();
export function registerLiveTrip(trip: CarTrip, driver: Driver) {
  LIVE_TRIPS.set(trip.id, trip);
  LIVE_DRIVERS.set(driver.id, driver);
}

export const getTrip = (id: string) => TRIPS.find((t) => t.id === id) ?? LIVE_TRIPS.get(id);
export const getDriver = (id: string) => (DRIVERS.find((d) => d.id === id) ?? LIVE_DRIVERS.get(id))!;

/* ------------------------------ Per-day availability ------------------------------ */
const SEAT_ORDER: SeatId[] = ["back-l", "back-r", "back-m", "front"];

/** Seats taken on a given day (0 = today). Later days are emptier. `extra` = seats this rider already holds. */
export function takenFor(trip: CarTrip, day: number, extra: SeatId[] = []): SeatId[] {
  // Backend trips already list the real seats for this departure.
  if (trip.live) return [...new Set([...trip.taken, ...extra])].sort((a, b) => SEAT_ORDER.indexOf(a) - SEAT_ORDER.indexOf(b));
  const base = trip.taken.slice(0, Math.max(0, trip.taken.length - Math.min(day, 2)));
  return [...new Set([...base, ...extra])].sort((a, b) => SEAT_ORDER.indexOf(a) - SEAT_ORDER.indexOf(b));
}

/** Mock co-rider names, one per taken seat. Real data comes from bookings. */
export function coRiders(trip: CarTrip, day: number): string[] {
  if (trip.live) return []; // other riders' names are not shared
  const n = trip.taken.length === 0 ? 0 : takenFor(trip, day).length;
  const start = trip.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + day;
  return Array.from({ length: n }, (_, i) => DEMO_CO_RIDERS[(start + i) % DEMO_CO_RIDERS.length]!);
}

/* ------------------------------ Matching ------------------------------ */
const NEAR_M = 600;

export interface RideMatch {
  trip: CarTrip;
  pickup: Stop;
  dropoff: Stop;
  /** Departure from the rider's pickup stop, 24h. */
  pickupTime: string;
  dropoffTime: string;
  /** Metres between the stop the rider asked for and the stop this trip actually uses (0 = exact). */
  pickupOffsetM: number;
  dropoffOffsetM: number;
  seatsLeft: number;
  taken: SeatId[];
}

/** Candidate stops on a route for what the rider asked for: the stop itself, or others in its area within walking range. */
function candidates(routeStopIds: string[], wanted: Stop, kind: "pickup" | "dropoff") {
  return routeStopIds
    .map((id) => getStop(id)!)
    .filter((s) => s[kind])
    .map((s) => ({ stop: s, d: s.id === wanted.id ? 0 : s.areaId === wanted.areaId ? distanceM(s, wanted) : Infinity }))
    .filter((c) => c.d <= NEAR_M);
}

export function matchTrips(fromId: string, toId: string, day: number, ownSeats: Record<string, SeatId[]> = {}): RideMatch[] {
  const from = getStop(fromId);
  const to = getStop(toId);
  if (!from || !to || from.id === to.id) return [];
  const out: RideMatch[] = [];
  for (const trip of TRIPS) {
    const route = getRoute(trip.routeId);
    if (!route) continue;
    const ids = route.stops.map((s) => s.stopId);
    let best: { p: ReturnType<typeof candidates>[number]; d: ReturnType<typeof candidates>[number] } | null = null;
    for (const p of candidates(ids, from, "pickup")) {
      for (const d of candidates(ids, to, "dropoff")) {
        if (ids.indexOf(p.stop.id) >= ids.indexOf(d.stop.id)) continue;
        if (!best || p.d + d.d < best.p.d + best.d.d) best = { p, d };
      }
    }
    if (!best) continue;
    const ps = route.stops.find((s) => s.stopId === best!.p.stop.id)!;
    const ds = route.stops.find((s) => s.stopId === best!.d.stop.id)!;
    const taken = takenFor(trip, day, ownSeats[trip.id] ?? []);
    out.push({
      trip,
      pickup: best.p.stop,
      dropoff: best.d.stop,
      pickupTime: addMinutes(trip.depart, ps.minutes),
      dropoffTime: addMinutes(trip.depart, ds.minutes),
      pickupOffsetM: best.p.d,
      dropoffOffsetM: best.d.d,
      seatsLeft: 4 - taken.length,
      taken,
    });
  }
  return out;
}

/** The stops of a trip's route between the rider's pickup and the end, valid as drop-offs. */
export function dropoffOptions(trip: CarTrip, pickupId: string): Stop[] {
  const route = getRoute(trip.routeId);
  if (!route) return [];
  const ids = route.stops.map((s) => s.stopId);
  const from = ids.indexOf(pickupId);
  return ids.slice(from + 1).map((id) => getStop(id)!).filter((s) => s.dropoff);
}

/** Minutes from a trip's start to a stop (for meet-by and arrival times). */
export function minutesTo(trip: CarTrip, stopId: string) {
  return getRoute(trip.routeId)?.stops.find((s) => s.stopId === stopId)?.minutes ?? 0;
}

export const meetBy = (pickupTime: string) => addMinutes(pickupTime, -POLICY.meetEarlyMinutes);

/** Other rides on the same route today with seats free, used when a driver cancels. */
export function alternativesFor(tripId: string, pickupId: string, dropoffId: string, day: number) {
  return matchTrips(pickupId, dropoffId, day).filter((m) => m.trip.id !== tripId && m.seatsLeft > 0).slice(0, 3);
}
