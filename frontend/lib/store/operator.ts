"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { makeId } from "../format";

export type BusStatus = "on-route" | "at-bay" | "maintenance";
export interface Bus { id: string; plate: string; seats: number; status: BusStatus; line: string }
export interface OperatorTrip { id: string; line: string; route: string; time: string; sold: number; seats: number; busId: string; fare: number }

export const LINES = [
  { id: "N1", route: "Nyanya → CBD", fare: 700 },
  { id: "K2", route: "Kubwa → Wuse II", fare: 900 },
  { id: "L3", route: "Lugbe → Garki", fare: 600 },
];

interface OperatorState {
  buses: Bus[];
  trips: OperatorTrip[];
  addBus: (b: { plate: string; seats: number }) => string;
  setBusStatus: (id: string, s: BusStatus) => void;
  addTrip: (t: { line: string; time: string; busId: string }) => void;
}

export const useOperator = create<OperatorState>()(
  persist(
    (set, get) => ({
      buses: [
        { id: "bus1", plate: "ABJ-114-XA", seats: 18, status: "on-route", line: "N1" },
        { id: "bus2", plate: "ABJ-221-XA", seats: 18, status: "at-bay", line: "K2" },
        { id: "bus3", plate: "ABJ-307-XB", seats: 18, status: "on-route", line: "L3" },
        { id: "bus4", plate: "ABJ-452-XC", seats: 14, status: "maintenance", line: "N1" },
      ],
      trips: [
        { id: "ot1", line: "N1", route: "Nyanya → CBD", time: "7:30", sold: 16, seats: 18, busId: "bus1", fare: 700 },
        { id: "ot2", line: "K2", route: "Kubwa → Wuse II", time: "7:45", sold: 9, seats: 18, busId: "bus2", fare: 900 },
        { id: "ot3", line: "L3", route: "Lugbe → Garki", time: "8:00", sold: 4, seats: 18, busId: "bus3", fare: 600 },
      ],
      addBus: ({ plate, seats }) => {
        const id = makeId("bus");
        set((s) => ({ buses: [...s.buses, { id, plate: plate.toUpperCase(), seats, status: "at-bay", line: "N1" }] }));
        return id;
      },
      setBusStatus: (id, status) => set((s) => ({ buses: s.buses.map((b) => (b.id === id ? { ...b, status } : b)) })),
      addTrip: ({ line, time, busId }) => {
        const l = LINES.find((x) => x.id === line)!;
        const bus = get().buses.find((b) => b.id === busId)!;
        const [h = "0", m = "00"] = time.split(":");
        const label = `${Number(h) % 12 || 12}:${m}`;
        set((s) => ({ trips: [...s.trips, { id: makeId("ot"), line, route: l.route, time: label, sold: 0, seats: bus.seats, busId, fare: l.fare }].sort((a, b) => a.time.localeCompare(b.time, undefined, { numeric: true })) }));
      },
    }),
    { name: "myway.operator", skipHydration: true },
  ),
);
