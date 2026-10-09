export type Role = "rider" | "driver" | "operator";
export type SeatId = "front" | "back-l" | "back-m" | "back-r";
export type PaymentMethod = "wallet" | "transfer" | "card" | "cash";

/* ------------------------- Location model (roadmap Phase 1) ------------------------- *
 *   Area ── Stop (name, landmark, coordinates, pickup allowed, drop-off allowed)
 *   Route = ordered list of stops with minutes + km from the start (so segment pricing is possible later)
 *   Trip  = one departure of a Route
 * Riders never type free-form addresses: every booking is pickup stop → drop-off stop. */
export interface Area {
  id: string;
  name: string;
}

export interface Stop {
  id: string;
  name: string;
  areaId: string;
  /** What you look for on the ground, e.g. "Bus bay by the flyover". */
  landmark: string;
  lat: number;
  lng: number;
  pickup: boolean;
  dropoff: boolean;
  /** Other things people type: estates, junctions, malls, offices. */
  aliases: string[];
  /** Position on the 390×520 illustrative map canvas (not real GPS). */
  x: number;
  y: number;
}

export interface RouteStop {
  stopId: string;
  minutes: number;
  km: number;
}

export interface Route {
  id: string;
  name: string;
  stops: RouteStop[];
}

/** A rider's "usual route": first-class concept, surfaced on Home, Search and Notifications. */
export interface SavedRoute {
  id: string;
  fromId: string;
  toId: string;
  /** 0 = Monday … 6 = Sunday */
  days: number[];
  /** "07:10" */
  time: string;
}

export interface Driver {
  id: string;
  name: string;
  initials: string;
  /** null until someone has rated this driver. */
  rating: number | null;
  trips: number;
  plate: string;
  make: string;
  color: string;
  verified: boolean;
}

export interface CarTrip {
  id: string;
  routeId: string;
  /** Departure from the first stop, 24h "07:10". */
  depart: string;
  /** ALL-IN back-seat price for the whole trip in naira (no separate fee or fuel line). Front seat adds a premium. */
  price: number;
  /** Seats already taken today. Other days derive from this (see lib/data/trips.ts). */
  taken: SeatId[];
  driverId: string;
  womenOnly?: boolean;
  /** From the backend: `taken` is the real seat list for this departure (no per-day mock adjustment). */
  live?: boolean;
}

export interface BusStop {
  name: string;
  time: string;
}

export interface BusLine {
  id: string;
  from: string;
  to: string;
  /** Area ids this line connects, so a car search can offer the bus as an alternative. */
  fromArea: string;
  toArea: string;
  price: number;
  headway: string;
  duration: string;
  bus: string;
  stops: BusStop[];
  departures: { time: string; left: number }[];
  takenSeats: string[];
}

export type BookingStatus = "upcoming" | "completed" | "cancelled";

/** Assigned → On the way → Arriving → Boarded → Dropped off */
export type BookingProgress = "assigned" | "on_the_way" | "arriving" | "boarded" | "dropped_off";

export type CancelledBy = "rider" | "driver" | "no_show";

export interface Booking {
  id: string;
  kind: "car" | "bus";
  title: string;
  sub: string;
  /** Departure from the rider's pickup stop, "07:10" (car) or the bus departure. */
  time: string;
  seat: string;
  code: string;
  total: number;
  payment: PaymentMethod;
  status: BookingStatus;
  createdAt: number;
  updatedAt: number;
  /** "Today", "Tomorrow" or "Fri 9 Oct", as shown when the rider booked. */
  dateLabel: string;
  tripId?: string;
  /** 0 = today, 1 = tomorrow … at the time of booking. */
  dayOffset?: number;
  lineId?: string;
  pickupId?: string;
  dropoffId?: string;
  progress: BookingProgress;
  cancelledBy?: CancelledBy;
  /** Set when the driver reports running late. */
  lateMinutes?: number;
  rating?: number;
  ratingTags?: string[];
  tip?: number;
  /** Exact pickup moment (ms), set for bookings from the backend. */
  pickupAt?: number;
}

export interface Message {
  id: string;
  bookingId: string;
  from: "rider" | "driver";
  text: string;
  at: number;
}

export interface Transaction {
  id: string;
  title: string;
  sub: string;
  amount: number;
  icon: "car" | "bus" | "bank" | "fuel" | "card";
}

export interface PendingTopUp {
  id: string;
  amount: number;
  createdAt: number;
}

export interface AppNotification {
  id: string;
  icon: "car" | "bus" | "wallet" | "star" | "route" | "users" | "bank" | "shield" | "doc" | "alert" | "scan" | "trend";
  title: string;
  body: string;
  time: string;
  unread?: boolean;
}

/** Typed booking errors: the UI switches on `code`, never on message text. */
export type BookingErrorCode = "NO_TRIP" | "NO_SELECTION" | "SEAT_TAKEN" | "INSUFFICIENT_FUNDS" | "ID_REQUIRED" | "UNAVAILABLE";
export type BookingResult =
  | { ok: true; id: string }
  | { ok: false; code: BookingErrorCode; message: string; shortBy?: number };
