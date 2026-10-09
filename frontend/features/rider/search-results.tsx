"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CarArt } from "@/components/illustrations/vehicles";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Chip, EmptyState } from "@/components/ui/primitives";
import { searchRides } from "@/lib/api/rides";
import { LIVE } from "@/lib/api/live";
import { track } from "@/lib/analytics";
import { busFor } from "@/lib/data/bus";
import { stopName, getStop } from "@/lib/data/stops";
import { matchTrips, type RideMatch } from "@/lib/data/trips";
import { dayOptions, formatNaira, toMinutes } from "@/lib/format";
import { formatDistance } from "@/lib/geo";
import { useBooking } from "@/lib/store/booking";
import { useRider } from "@/lib/store/rider";
import type { SavedRoute } from "@/lib/types";
import { ownSeatMap } from "@/lib/api/rides";
import { RoutePicker } from "./route-picker";
import { RideCard } from "./ride-card";

type Sort = "earliest" | "cheapest";
type Loaded = { key: string; ok: boolean; rides: RideMatch[] };

/** Reasons the system can actually compute. Never invented scores like "92% match". */
function reasonsFor(m: RideMatch, wanted: { from: string; to: string }, day: number, usual?: SavedRoute): string[] {
  const out: string[] = [];
  if (m.dropoffOffsetM > 0) out.push(`Drops you ${formatDistance(m.dropoffOffsetM)} from ${stopName(wanted.to)}`);
  if (m.pickupOffsetM > 0) out.push(`Picks you up ${formatDistance(m.pickupOffsetM)} from ${stopName(wanted.from)}`);
  if (usual) {
    const diff = toMinutes(m.pickupTime) - toMinutes(usual.time);
    if (Math.abs(diff) <= 30) out.push(diff === 0 ? "Leaves at your usual time" : `Leaves ${Math.abs(diff)} minutes ${diff < 0 ? "before" : "after"} your usual time`);
  }
  const n = m.taken.length;
  if (n >= 2) out.push(`${n} people have booked this trip${day === 0 ? " today" : ""}`);
  return out.slice(0, 2);
}

export function SearchResults({ initialFrom, initialTo, initialDay }: { initialFrom: string; initialTo: string; initialDay: number }) {
  const bookings = useBooking((s) => s.bookings);
  const usualRoutes = useRider((s) => s.usualRoutes);
  const [route, setRoute] = useState({ from: initialFrom, to: initialTo });
  const [day, setDay] = useState(initialDay);
  const [sort, setSort] = useState<Sort>("earliest");
  const [women, setWomen] = useState(false);
  const [front, setFront] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const days = useMemo(() => dayOptions(4), []);
  const ready = Boolean(route.from && route.to && route.from !== route.to);
  const key = `${route.from}|${route.to}|${day}|${attempt}`;

  // Load rides whenever the route, day or retry changes. Loading and error are real states (the backend will need them).
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    searchRides({ from: route.from, to: route.to, day, attempt }, bookings)
      .then((rides) => { if (alive) { setLoaded({ key, ok: true, rides }); track("search", { results: rides.length, day }); } })
      .catch(() => { if (alive) setLoaded({ key, ok: false, rides: [] }); });
    return () => { alive = false; };
    // `bookings` is read when the search runs; changing it should not re-run the search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);

  const loading = ready && loaded?.key !== key;
  const failed = ready && loaded?.key === key && !loaded.ok;
  const usual = usualRoutes.find((u) => u.fromId === route.from && u.toId === route.to);

  let rides = loaded?.key === key ? loaded.rides : [];
  if (women) rides = rides.filter((r) => r.trip.womenOnly);
  if (front) rides = rides.filter((r) => !r.taken.includes("front"));
  rides = [...rides].sort((a, b) => (sort === "earliest" ? toMinutes(a.pickupTime) - toMinutes(b.pickupTime) : a.trip.price - b.trip.price));

  const bus = ready ? busFor(route.from, route.to) : undefined;
  const nextDay = () => {
    if (LIVE) return (day + 1) % days.length; // availability lives on the server; just try the next day
    const own = ownSeatMap(bookings, 0);
    for (let d = 1; d < days.length; d++) if (matchTrips(route.from, route.to, (day + d) % days.length, own).length) return (day + d) % days.length;
    return (day + 1) % days.length;
  };

  return (
    <section aria-labelledby="results-title" className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/app" aria-label="Back to home" className="pressable grid size-11 place-items-center rounded-full border-2 border-line bg-surface hover:bg-surface-sunken"><Icon name="arrowL" size={20} /></Link>
        <h1 id="results-title" className="text-title">Rides for your route</h1>
      </div>

      <RoutePicker from={route.from} to={route.to} onChange={setRoute} />

      <div className="space-y-2.5">
        <div className="space-y-1.5">
          <p className="text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted" id="when-label">When</p>
          <div className="rail" role="radiogroup" aria-labelledby="when-label">
            {days.map((d) => <Chip key={d.offset} role="radio" aria-checked={day === d.offset} active={day === d.offset} onClick={() => setDay(d.offset)}>{d.label}</Chip>)}
          </div>
        </div>
        <div className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-1.5">
          <div className="space-y-1.5">
            <p className="text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted" id="sort-label">Sort</p>
            <div className="flex gap-2" role="radiogroup" aria-labelledby="sort-label">
              <Chip role="radio" aria-checked={sort === "earliest"} active={sort === "earliest"} icon="clock" onClick={() => setSort("earliest")}>Earliest</Chip>
              <Chip role="radio" aria-checked={sort === "cheapest"} active={sort === "cheapest"} icon="cash" onClick={() => setSort("cheapest")}>Cheapest</Chip>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted" id="filter-label">Filter</p>
          <div className="rail" role="group" aria-labelledby="filter-label">
            <Chip active={women} icon="shield" onClick={() => setWomen((v) => !v)}>Women only</Chip>
            <Chip active={front} icon="car" onClick={() => setFront((v) => !v)}>Front seat free</Chip>
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{loading ? "Finding rides going your way" : `${rides.length} rides found`}</p>

      {!ready && <EmptyState title="Where are you going?" body="Choose a pickup and a drop-off stop to see rides going your way."><CarArt className="w-40" /></EmptyState>}

      {loading && (
        <div aria-busy="true" className="space-y-3" role="status">
          <p className="flex items-center gap-2.5 font-bold text-fg-secondary"><span className="size-4 animate-spin-wheel rounded-full border-[3px] border-line-strong border-t-transparent" />Finding rides going your way…</p>
          {[0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-surface-sunken" />)}
        </div>
      )}

      {failed && (
        <EmptyState title="We couldn’t load available rides." body="Check your connection and try again." action={<Button icon="history" onClick={() => setAttempt((a) => a + 1)}>Try again</Button>}>
          <CarArt className="w-40" />
        </EmptyState>
      )}

      {ready && !loading && !failed && (rides.length > 0 ? (
        <ul className="stagger grid gap-3">
          {rides.map((r, i) => <li key={r.trip.id} style={{ "--i": i } as React.CSSProperties}><RideCard match={r} day={day} highlight={i === 0 && sort === "earliest"} reasons={reasonsFor(r, route, day, usual)} /></li>)}
        </ul>
      ) : (
        <EmptyState
          title={`No rides found for ${getStop(route.from)?.name.split(" ")[0]} → ${getStop(route.to)?.name.split(" ")[0]} at this time.`}
          body={women || front ? "Try removing a filter, or pick another time." : "Drivers post trips every day. Pick another time, or tell us you travel this way."}
          action={
            <div className="grid w-full gap-2.5">
              <Button icon="clock" onClick={() => { setWomen(false); setFront(false); setDay(nextDay()); }}>Try another time</Button>
              <ButtonLink href={`/app/request-route?from=${route.from}&to=${route.to}`} variant="outline" icon="route">Request this route</ButtonLink>
              {bus && <ButtonLink href={`/app/bus/${bus.id}`} variant="secondary" icon="bus">Take the {bus.id} bus · from {formatNaira(bus.price)}</ButtonLink>}
            </div>
          }
        >
          <CarArt className="w-40" />
        </EmptyState>
      ))}

      {ready && !loading && !failed && rides.length > 0 && bus && (
        <Link href={`/app/bus/${bus.id}`} className="pressable flex min-h-14 items-center gap-3 rounded-xl bg-secondary p-4 text-secondary-fg">
          <Icon name="bus" size={22} className="text-primary" />
          <span className="flex-1 font-bold">Scheduled bus {bus.id} · {formatNaira(bus.price)}</span>
          <Icon name="chevR" size={18} className="text-primary" />
        </Link>
      )}
    </section>
  );
}
