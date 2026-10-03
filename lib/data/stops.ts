import type { Stop } from "../types";

/** x/y are positions on the illustrative 390×520 map canvas (not real GPS). */
export const STOPS: Stop[] = [
  { id: "nyanya", name: "Nyanya Bridge stop", area: "Nyanya", x: 90, y: 400 },
  { id: "mararaba", name: "Mararaba Junction", area: "Mararaba", x: 128, y: 300 },
  { id: "aya", name: "AYA Roundabout", area: "Asokoro", x: 200, y: 262 },
  { id: "berger", name: "Berger Junction", area: "Wuse", x: 250, y: 180 },
  { id: "cbd", name: "CBD Terminal", area: "Central Business District", x: 300, y: 130 },
  { id: "kubwa", name: "Kubwa Expressway", area: "Kubwa", x: 70, y: 150 },
  { id: "wuse2", name: "Wuse II", area: "Wuse II", x: 230, y: 220 },
  { id: "lugbe", name: "Lugbe FHA", area: "Lugbe", x: 60, y: 430 },
  { id: "garki", name: "Garki Area 1", area: "Garki", x: 250, y: 300 },
  { id: "gwagwalada", name: "Gwagwalada Park", area: "Gwagwalada", x: 40, y: 340 },
  { id: "jikwoyi", name: "Jikwoyi Gate", area: "Jikwoyi", x: 130, y: 420 },
];

export const getStop = (id: string) => STOPS.find((s) => s.id === id);
export const stopName = (id: string) => getStop(id)?.name ?? id;
