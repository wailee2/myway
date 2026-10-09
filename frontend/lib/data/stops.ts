import type { Area, Route, Stop } from "../types";

/**
 * SEED DATA. Stop names, landmarks and coordinates are placeholders for the prototype:
 * coordinates are derived from the illustrative map canvas (x/y), NOT surveyed GPS.
 * Replace with surveyed stops (and verify each landmark on the ground) before launch.
 */
export const AREAS: Area[] = [
  { id: "nyanya", name: "Nyanya" },
  { id: "mararaba", name: "Mararaba" },
  { id: "asokoro", name: "Asokoro" },
  { id: "wuse", name: "Wuse" },
  { id: "jabi", name: "Jabi" },
  { id: "cbd", name: "Central Business District" },
  { id: "kubwa", name: "Kubwa" },
  { id: "gwarinpa", name: "Gwarinpa" },
  { id: "lugbe", name: "Lugbe" },
  { id: "garki", name: "Garki" },
  { id: "gwagwalada", name: "Gwagwalada" },
  { id: "jikwoyi", name: "Jikwoyi" },
];

// Illustrative lat/lng from canvas position. 1 canvas px ≈ 80 m east-west, ≈ 20 m north-south.
const geo = (x: number, y: number) => ({ lat: +(9.1 - y * 0.00018).toFixed(5), lng: +(7.3 + x * 0.00075).toFixed(5), x, y });

type Seed = Omit<Stop, "lat" | "lng" | "x" | "y" | "aliases" | "pickup" | "dropoff"> & { x: number; y: number; aliases?: string[]; pickup?: boolean; dropoff?: boolean };
const stop = (s: Seed): Stop => ({ aliases: [], pickup: true, dropoff: true, ...s, ...geo(s.x, s.y) });

export const STOPS: Stop[] = [
  stop({ id: "nyanya", name: "Nyanya Bridge stop", areaId: "nyanya", landmark: "Beside the footbridge, service-road side", x: 90, y: 400, aliases: ["Nyanya Bridge", "Nyanya Market", "Nyanya"] }),
  stop({ id: "mararaba", name: "Mararaba Junction", areaId: "mararaba", landmark: "Lay-by before the junction", x: 128, y: 300, aliases: ["Mararaba"] }),
  stop({ id: "aya", name: "AYA Roundabout", areaId: "asokoro", landmark: "Service lane before the roundabout", x: 200, y: 262, aliases: ["AYA", "Asokoro Extension"] }),
  stop({ id: "berger", name: "Berger Junction", areaId: "wuse", landmark: "Bus bay by the flyover", x: 250, y: 180, aliases: ["Berger", "Julius Berger yard", "Berger roundabout"] }),
  stop({ id: "cbd", name: "CBD Terminal", areaId: "cbd", landmark: "Terminal bay 2", x: 300, y: 130, aliases: ["CBD", "Central Area", "Three Arms Zone"] }),
  stop({ id: "kubwa", name: "Kubwa Expressway", areaId: "kubwa", landmark: "Expressway lay-by near the roundabout", x: 70, y: 150, aliases: ["Kubwa", "Kubwa Roundabout"] }),
  stop({ id: "gwarinpa", name: "Gwarinpa 1st Avenue", areaId: "gwarinpa", landmark: "Estate gate on 1st Avenue", x: 112, y: 172, aliases: ["Gwarinpa", "Gwarinpa Estate", "1st Avenue", "Kado"] }),
  stop({ id: "jabi-park", name: "Jabi Motor Park", areaId: "jabi", landmark: "Park gate on the service road", x: 163, y: 181, aliases: ["Jabi Park", "Jabi Motor Park gate"] }),
  stop({ id: "jabi-mall", name: "Jabi Lake Mall", areaId: "jabi", landmark: "Main entrance car park", x: 168, y: 176, aliases: ["Jabi Lake", "Jabi mall", "Lake Mall"] }),
  stop({ id: "jabi-bridge", name: "Jabi Under Bridge", areaId: "jabi", landmark: "Lay-by under the bridge", x: 174, y: 183, pickup: false, aliases: ["Jabi Bridge", "Under bridge"] }),
  stop({ id: "wuse2", name: "Wuse II", areaId: "wuse", landmark: "Market gate on the main road", x: 230, y: 220, aliases: ["Wuse 2", "Wuse Zone 2", "Wuse Market", "Zone 4"] }),
  stop({ id: "lugbe", name: "Lugbe FHA", areaId: "lugbe", landmark: "FHA estate main gate", x: 60, y: 430, aliases: ["Lugbe", "FHA Lugbe"] }),
  stop({ id: "airport", name: "Airport Road Junction", areaId: "lugbe", landmark: "Junction lay-by, airport side", x: 150, y: 372, aliases: ["Airport Road", "Airport"] }),
  stop({ id: "garki", name: "Garki Area 1", areaId: "garki", landmark: "Area 1 shopping complex", x: 250, y: 300, aliases: ["Garki", "Area 1", "Garki Market"] }),
  stop({ id: "gwagwalada", name: "Gwagwalada Park", areaId: "gwagwalada", landmark: "Main motor park gate", x: 40, y: 340, aliases: ["Gwagwalada", "Gwag"] }),
  stop({ id: "jikwoyi", name: "Jikwoyi Gate", areaId: "jikwoyi", landmark: "Estate gate on the main road", x: 130, y: 420, aliases: ["Jikwoyi"] }),
];

export const getStop = (id: string) => STOPS.find((s) => s.id === id);
export const stopName = (id: string) => getStop(id)?.name ?? id;
export const getArea = (id: string) => AREAS.find((a) => a.id === id);
export const areaName = (stopId: string) => getArea(getStop(stopId)?.areaId ?? "")?.name ?? "";

/** Stops that share an area with this one (e.g. every Jabi stop). */
export const stopsInArea = (areaId: string) => STOPS.filter((s) => s.areaId === areaId);

const rs = (stopId: string, minutes: number, km: number) => ({ stopId, minutes, km });

export const ROUTES: Route[] = [
  { id: "r-nyanya-cbd", name: "Nyanya → CBD", stops: [rs("nyanya", 0, 0), rs("mararaba", 8, 3.5), rs("aya", 20, 9), rs("berger", 32, 14), rs("cbd", 45, 18)] },
  { id: "r-nyanya-jabi", name: "Nyanya → Jabi", stops: [rs("nyanya", 0, 0), rs("aya", 16, 9), rs("berger", 30, 14), rs("jabi-park", 38, 17), rs("jabi-mall", 41, 18), rs("jabi-bridge", 44, 19)] },
  { id: "r-cbd-nyanya", name: "CBD → Nyanya", stops: [rs("cbd", 0, 0), rs("berger", 12, 4), rs("aya", 24, 9), rs("nyanya", 45, 18)] },
  { id: "r-kubwa-wuse", name: "Kubwa → Wuse II", stops: [rs("kubwa", 0, 0), rs("gwarinpa", 14, 9), rs("jabi-mall", 34, 18), rs("wuse2", 50, 24)] },
  { id: "r-gwarinpa-wuse", name: "Gwarinpa → Wuse II", stops: [rs("gwarinpa", 0, 0), rs("jabi-park", 12, 6), rs("jabi-mall", 16, 7), rs("wuse2", 30, 12)] },
  { id: "r-lugbe-garki", name: "Lugbe → Garki", stops: [rs("lugbe", 0, 0), rs("airport", 14, 7), rs("garki", 40, 14)] },
  { id: "r-gwagwalada-cbd", name: "Gwagwalada → CBD", stops: [rs("gwagwalada", 0, 0), rs("cbd", 70, 48)] },
];

export const getRoute = (id: string) => ROUTES.find((r) => r.id === id);

/** Stops people see first in the location sheet. */
export const POPULAR_STOP_IDS = ["nyanya", "cbd", "jabi-mall", "gwarinpa", "wuse2", "berger", "kubwa", "garki"];

/** Distance and time along a route between two stops, if some route serves them in that order. */
export function routeSpan(fromId: string, toId: string) {
  for (const r of ROUTES) {
    const a = r.stops.find((s) => s.stopId === fromId);
    const b = r.stops.find((s) => s.stopId === toId);
    if (a && b && r.stops.indexOf(a) < r.stops.indexOf(b)) return { km: b.km - a.km, minutes: b.minutes - a.minutes, routeId: r.id };
  }
  return null;
}
