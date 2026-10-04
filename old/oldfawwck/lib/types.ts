export type Role = "rider" | "driver" | "operator";
export type SeatId = "front" | "back-l" | "back-m" | "back-r";
export type PaymentMethod = "wallet" | "transfer" | "card" | "cash";

export interface Stop {
  id: string;
  name: string;
  area: string;
  /** Position on the 390×520 illustrative map canvas */
  x: number;
  y: number;
}

export interface Driver {
  id: string;
  name: string;
  initials: string;
  rating: number;
  trips: number;
  plate: string;
  car: string;
  verified: boolean;
}

export interface CarTrip {
  id: string;
  fromId: string;
  toId: string;
  depart: string;
  arrive: string;
  /** Back-seat fare in naira. Front seat costs more (see lib/pricing.ts). */
  price: number;
  taken: SeatId[];
  driverId: string;
  tag: string;
  womenOnly?: boolean;
}

export interface BusStop {
  name: string;
  time: string;
}

export interface BusLine {
  id: string;
  from: string;
  to: string;
  price: number;
  headway: string;
  duration: string;
  bus: string;
  stops: BusStop[];
  departures: { time: string; left: number }[];
  takenSeats: string[];
}

export type BookingStatus = "upcoming" | "completed" | "cancelled";

export interface Booking {
  id: string;
  kind: "car" | "bus";
  title: string;
  sub: string;
  time: string;
  seat: string;
  code: string;
  total: number;
  payment: PaymentMethod;
  status: BookingStatus;
  createdAt: number;
  tripId?: string;
  lineId?: string;
  progress: BookingProgress;
  rating?: number;
}

/** Simulated live-trip progress for the MVP demo controls */
export type BookingProgress = "confirmed" | "arriving" | "onboard" | "arrived";

export interface Transaction {
  id: string;
  title: string;
  sub: string;
  amount: number;
  icon: "car" | "bus" | "bank" | "fuel" | "card";
}

export interface AppNotification {
  id: string;
  icon: "car" | "bus" | "wallet" | "star" | "route";
  title: string;
  body: string;
  time: string;
  unread?: boolean;
}
