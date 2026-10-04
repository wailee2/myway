import type { CarTrip, Driver } from "../types";

export const DRIVERS: Driver[] = [
  { id: "d1", name: "Ade Okafor", initials: "AO", rating: 4.9, trips: 312, plate: "ABJ-482-KJ", car: "Toyota Corolla · white", verified: true },
  { id: "d2", name: "Chioma Eze", initials: "CE", rating: 4.8, trips: 204, plate: "ABJ-190-LM", car: "Honda Accord · silver", verified: true },
  { id: "d3", name: "Musa Ibrahim", initials: "MI", rating: 4.9, trips: 421, plate: "ABJ-733-RT", car: "Toyota Camry · black", verified: true },
  { id: "d4", name: "Ngozi Obi", initials: "NO", rating: 4.7, trips: 98, plate: "ABJ-215-QW", car: "Kia Rio · white", verified: true },
];

export const TRIPS: CarTrip[] = [
  { id: "t-701", fromId: "nyanya", toId: "cbd", depart: "7:10", arrive: "7:55", price: 1200, taken: ["back-l", "back-r"], driverId: "d1", tag: "Leaves 7:10 or when full" },
  { id: "t-702", fromId: "nyanya", toId: "cbd", depart: "7:25", arrive: "8:15", price: 1200, taken: ["front", "back-l", "back-m"], driverId: "d2", tag: "Leaves when full", womenOnly: true },
  { id: "t-703", fromId: "nyanya", toId: "cbd", depart: "7:40", arrive: "8:25", price: 1100, taken: ["back-r"], driverId: "d3", tag: "Leaves 7:40 sharp" },
  { id: "t-711", fromId: "kubwa", toId: "wuse2", depart: "7:30", arrive: "8:20", price: 1500, taken: ["front"], driverId: "d3", tag: "Leaves 7:30 or when full" },
  { id: "t-712", fromId: "kubwa", toId: "wuse2", depart: "8:00", arrive: "8:50", price: 1500, taken: [], driverId: "d4", tag: "Leaves when full", womenOnly: true },
  { id: "t-721", fromId: "lugbe", toId: "garki", depart: "7:20", arrive: "8:00", price: 900, taken: ["back-l", "back-m"], driverId: "d1", tag: "Leaves 7:20 or when full" },
  { id: "t-722", fromId: "gwagwalada", toId: "cbd", depart: "6:40", arrive: "7:50", price: 1800, taken: ["front", "back-r"], driverId: "d2", tag: "Leaves when full" },
];

export const getTrip = (id: string) => TRIPS.find((t) => t.id === id);
export const getDriver = (id: string) => DRIVERS.find((d) => d.id === id)!;
export const findTrips = (fromId: string, toId: string) =>
  TRIPS.filter((t) => t.fromId === fromId && t.toId === toId);
