import type { BusLine } from "../types";

export const BUS_LINES: BusLine[] = [
  {
    id: "N1", from: "Nyanya Bridge", to: "CBD Terminal", price: 700, headway: "every 15 min", duration: "45 min", bus: "Coaster ABJ-317-XA",
    stops: [
      { name: "Nyanya Bridge", time: "7:30" }, { name: "Mararaba Junction", time: "7:38" },
      { name: "AYA Roundabout", time: "7:46" }, { name: "Berger Junction", time: "7:58" }, { name: "CBD Terminal", time: "8:15" },
    ],
    departures: [{ time: "6:30", left: 4 }, { time: "7:00", left: 9 }, { time: "7:30", left: 12 }, { time: "8:00", left: 18 }],
    takenSeats: ["1A", "2C", "3B", "3D", "5A", "6D", "7B", "2B", "6A"],
  },
  {
    id: "K2", from: "Kubwa", to: "Wuse II", price: 900, headway: "every 20 min", duration: "50 min", bus: "Coaster ABJ-552-KD",
    stops: [
      { name: "Kubwa Expressway", time: "7:45" }, { name: "Dutse", time: "7:58" }, { name: "Gwarinpa", time: "8:12" }, { name: "Wuse II", time: "8:35" },
    ],
    departures: [{ time: "7:15", left: 6 }, { time: "7:45", left: 9 }, { time: "8:15", left: 14 }],
    takenSeats: ["1B", "2A", "4C", "5D", "6B"],
  },
  {
    id: "L3", from: "Lugbe", to: "Garki", price: 800, headway: "every 30 min", duration: "40 min", bus: "Coaster ABJ-908-LG",
    stops: [{ name: "Lugbe FHA", time: "8:00" }, { name: "Airport Road", time: "8:14" }, { name: "Garki Area 1", time: "8:40" }],
    departures: [{ time: "7:30", left: 10 }, { time: "8:00", left: 14 }, { time: "8:30", left: 16 }],
    takenSeats: ["2B", "3A", "5C"],
  },
];

export const getLine = (id: string) => BUS_LINES.find((l) => l.id === id);

export const SEAT_ROWS = 7;
export const SEAT_COLS = ["A", "B", "C", "D"] as const;
export const BUS_PASSES = [
  { id: "weekly", name: "Weekly", price: 3000, unit: "/ 10 rides", tag: null },
  { id: "monthly", name: "Monthly", price: 11900, unit: "/ 44 rides", tag: "Save 15%" },
  { id: "employer", name: "Employer", price: null, unit: "for your team", tag: null },
] as const;
