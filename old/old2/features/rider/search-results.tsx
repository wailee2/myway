"use client";

import Link from "next/link";
import { useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Chip, EmptyState } from "@/components/ui/primitives";
import { CarArt } from "@/components/illustrations/vehicles";
import { MapCanvas } from "@/components/map/map-canvas";
import { BUS_LINES } from "@/lib/data/bus";
import { findTrips } from "@/lib/data/trips";
import { formatNaira } from "@/lib/format";
import { RoutePicker } from "./route-picker";
import { TripCard } from "./trip-card";
import { stopName } from "@/lib/data/stops";

export function SearchResults({ initialFrom, initialTo }: { initialFrom: string; initialTo: string }) {
  const [route, setRoute] = useState({ from: initialFrom, to: initialTo });
  const [day, setDay] = useState(0);
  const [earliest, setEarliest] = useState(true);
  const [women, setWomen] = useState(false);
  const [front, setFront] = useState(false);

  let trips = findTrips(route.from, route.to);
  if (women) trips = trips.filter((t) => t.womenOnly);
  if (front) trips = trips.filter((t) => !t.taken.includes("front"));
  trips = [...trips].sort((a, b) => (earliest ? a.depart.localeCompare(b.depart, undefined, { numeric: true }) : a.price - b.price));
  const bus = BUS_LINES.find((l) => l.from.startsWith(stopName(route.from).split(" ")[0]!) && l.to.startsWith(stopName(route.to).split(" ")[0]!));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,32rem)_1fr] lg:gap-10">
      <section aria-labelledby="results-title" className="space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/app" aria-label="Back to home" className="pressable grid size-11 place-items-center rounded-full border-2 border-line bg-surface hover:bg-surface-sunken"><Icon name="arrowL" size={20} /></Link>
          <h1 id="results-title" className="text-title lg:text-display-md">Available cars</h1>
        </div>
        <RoutePicker from={route.from} to={route.to} onChange={setRoute} idPrefix="sr" />
        <div className="rail" role="group" aria-label="Day">
          {["Today", "Wed 30", "Thu 1", "Fri 2"].map((d, i) => <Chip key={d} active={day === i} onClick={() => setDay(i)}>{d}</Chip>)}
        </div>
        <div className="rail" role="group" aria-label="Filters">
          <Chip active={earliest} icon="clock" onClick={() => setEarliest((v) => !v)}>{earliest ? "Earliest" : "Cheapest"}</Chip>
          <Chip active={women} icon="shield" onClick={() => setWomen((v) => !v)}>Women-only</Chip>
          <Chip active={front} icon="car" onClick={() => setFront((v) => !v)}>Front seat free</Chip>
        </div>

        <p className="sr-only" aria-live="polite">{trips.length} cars found</p>
        {trips.length ? (
          <ul className="stagger grid gap-3">
            {trips.map((t, i) => <li key={t.id} style={{ "--i": i } as React.CSSProperties}><TripCard trip={t} highlight={i === 0} /></li>)}
          </ul>
        ) : (
          <EmptyState title="No cars on this route yet" body="Drivers post trips every day. Tell us when you travel and we’ll alert you the moment a seat opens." action={<div className="grid w-full gap-2.5"><ButtonLink href="/app/request-route" icon="route">Request this route</ButtonLink>{bus && <ButtonLink href={`/app/bus/${bus.id}`} variant="secondary" icon="bus">Try the {bus.departures[2]?.time ?? "7:30"} bus</ButtonLink>}</div>}>
            <CarArt className="w-44" />
          </EmptyState>
        )}

        {bus && trips.length > 0 && (
          <Link href={`/app/bus/${bus.id}`} className="pressable flex items-center gap-3 rounded-xl bg-secondary p-4 text-secondary-fg">
            <Icon name="bus" size={22} className="text-primary" />
            <span className="flex-1 font-bold">Bus {bus.id} at {bus.departures[2]?.time} · {formatNaira(bus.price)} · 12 seats</span>
            <Icon name="chevR" size={18} className="text-primary" />
          </Link>
        )}
      </section>
      <div className="hidden overflow-hidden rounded-2xl border-2 border-outline lg:sticky lg:top-8 lg:block lg:h-[calc(100dvh-7rem)]">
        <MapCanvas route={{ fromId: route.from, toId: route.to }} label={`Route from ${stopName(route.from)} to ${stopName(route.to)}`} />
      </div>
    </div>
  );
}
