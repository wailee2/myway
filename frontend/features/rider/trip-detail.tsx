"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CarArt } from "@/components/illustrations/vehicles";
import { MapCanvas } from "@/components/map/map-canvas";
import { StickyCta } from "@/components/layout/sticky-cta";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog, RadioCard, useDialog } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Avatar, Badge, EmptyState, Eyebrow } from "@/components/ui/primitives";
import { track } from "@/lib/analytics";
import { LIVE } from "@/lib/api/live";
import { useTrip } from "@/lib/hooks/use-trip";
import { getRoute, getStop } from "@/lib/data/stops";
import { coRiders, dropoffOptions, getDriver, getTrip, meetBy, minutesTo, takenFor } from "@/lib/data/trips";
import { addMinutes, formatNaira, formatTime, ratingLabel } from "@/lib/format";
import { distanceM, formatDistance, walkMinutes } from "@/lib/geo";
import { allInPrice } from "@/lib/pricing";
import { ownSeatMap } from "@/lib/api/rides";
import { useBooking } from "@/lib/store/booking";
import { useRider } from "@/lib/store/rider";
import type { SeatId } from "@/lib/types";
import { CarSeatPicker } from "./car-seat-picker";
import { PolicyNote } from "./policy-note";

type Props = { id: string; from?: string; to?: string; day: number };

/** Loads the trip first (a direct visit or refresh has nothing in memory), then shows the page. */
export function TripDetail(props: Props) {
  const { loading } = useTrip(props.id);
  if (loading) return <div className="mx-auto max-w-2xl space-y-4 pt-4" role="status" aria-busy="true"><div className="h-44 animate-pulse rounded-2xl bg-surface-sunken" /><div className="h-72 animate-pulse rounded-xl bg-surface-sunken" /></div>;
  return <TripDetailLoaded key={props.id} {...props} />;
}

function TripDetailLoaded({ id, from, to, day }: Props) {
  const router = useRouter();
  const { setDraft, bookings, balance } = useBooking();
  const lastLocation = useRider((s) => s.lastLocation);
  const trip = getTrip(id);
  const route = trip ? getRoute(trip.routeId) : undefined;
  const stopIds = route?.stops.map((s) => s.stopId) ?? [];

  // Pickup and drop-off: what the rider searched, if this trip serves it; otherwise the trip's own ends.
  const pickupId = from && stopIds.includes(from) && getStop(from)?.pickup ? from : stopIds.find((s) => getStop(s)?.pickup) ?? "";
  const dropOptions = trip ? dropoffOptions(trip, pickupId) : [];
  const [dropoffId, setDropoffId] = useState(() => (to && dropOptions.some((s) => s.id === to) ? to : dropOptions[dropOptions.length - 1]?.id ?? ""));
  const dlg = useDialog();

  const taken = trip ? takenFor(trip, day, ownSeatMap(bookings, day)[trip.id] ?? []) : [];
  const [seat, setSeat] = useState<SeatId>(() => (["back-m", "back-l", "back-r", "front"] as SeatId[]).find((s) => !taken.includes(s)) ?? "back-m");

  if (!trip || !route || !pickupId || !dropoffId) {
    return <EmptyState title="That ride has left" body="This car is no longer available. Choose another ride." action={<ButtonLink href="/app" icon="search">Find a ride</ButtonLink>}><CarArt className="w-40" /></EmptyState>;
  }

  const driver = getDriver(trip.driverId);
  const pickup = getStop(pickupId)!;
  const dropoff = getStop(dropoffId)!;
  const pickupTime = addMinutes(trip.depart, minutesTo(trip, pickupId));
  const dropTime = addMinutes(trip.depart, minutesTo(trip, dropoffId));
  const price = allInPrice(trip, seat, pickupId, dropoffId);
  const people = coRiders(trip, day);
  const walk = lastLocation ? distanceM(lastLocation, pickup) : null;
  const via = stopIds.slice(stopIds.indexOf(pickupId), stopIds.indexOf(dropoffId) + 1);
  const back = `/app/search?from=${pickupId}&to=${dropoffId}&day=${day}`;

  const reserve = () => {
    setDraft({ tripId: trip.id, seat, from: pickupId, to: dropoffId, pickupId, dropoffId, day, payment: LIVE || balance >= price ? "wallet" : "card" });
    track("ride_selected", { trip: trip.id, seat });
    router.push("/app/checkout?kind=car");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Ride details" back={back} />

      <div className="h-44 overflow-hidden rounded-2xl border-2 border-outline">
        <MapCanvas route={{ fromId: pickupId, toId: dropoffId, via }} label={`Route from ${pickup.name} to ${dropoff.name}`} />
      </div>

      <section aria-label="Your ride" className="divide-y divide-line rounded-xl border border-line bg-surface px-4">
        {/* Pickup */}
        <div className="flex items-start gap-4 py-4">
          <span className="mt-1.5 size-4 shrink-0 rounded-full border-[3.5px] border-outline bg-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <Eyebrow>Pickup</Eyebrow>
            <p className="font-bold">{pickup.name}</p>
            <p className="text-sm text-fg-secondary">{pickup.landmark}</p>
            <p className="mt-1 text-sm font-semibold">Be there by {formatTime(meetBy(pickupTime))}{walk !== null && ` · ${walkMinutes(walk)} min walk (${formatDistance(walk)})`}</p>
          </div>
          <p className="font-display text-2xl font-extrabold tracking-[-0.03em]">{formatTime(pickupTime)}</p>
        </div>
        {/* Drop-off */}
        <div className="flex items-start gap-4 py-4">
          <span className="mt-1.5 size-4 shrink-0 rounded-[4px] bg-outline" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <Eyebrow>Drop-off</Eyebrow>
            <p className="font-bold">{dropoff.name}</p>
            <p className="text-sm text-fg-secondary">{dropoff.landmark}</p>
            {dropOptions.length > 1 && <button type="button" onClick={dlg.open} className="mt-1 min-h-11 text-sm font-extrabold underline underline-offset-4">Change drop-off stop</button>}
          </div>
          <p className="font-display text-2xl font-extrabold tracking-[-0.03em] text-fg-muted">{formatTime(dropTime)}</p>
        </div>
        {/* Route */}
        <details className="py-3">
          <summary className="flex min-h-11 cursor-pointer items-center justify-between text-sm font-bold"><span>{route.name} · {via.length} stops on your trip</span><Icon name="chevD" size={18} className="text-fg-muted" /></summary>
          <ol className="mt-2 space-y-1.5 pb-1 text-sm">{via.map((sid) => <li key={sid} className="flex justify-between gap-3"><span className={sid === pickupId || sid === dropoffId ? "font-bold" : "text-fg-secondary"}>{getStop(sid)?.name}</span><span className="text-fg-muted">{formatTime(addMinutes(trip.depart, minutesTo(trip, sid)))}</span></li>)}</ol>
        </details>
        {/* Driver */}
        <div className="flex items-center gap-3.5 py-4">
          <Avatar name={driver.name} size={48} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 font-bold">{driver.name}{driver.verified && <Icon name="badge" size={16} className="text-success" strokeWidth={2.4} aria-label="ID verified" />}</p>
            <p className="text-sm text-fg-muted">{ratingLabel(driver.rating)} · {driver.trips} trips{driver.verified ? " · ID verified" : ""}</p>
            <p className="text-sm font-semibold">{driver.color} {driver.make} · {driver.plate}</p>
          </div>
          {trip.womenOnly && <Badge tone="info" icon="shield">Women only</Badge>}
        </div>
        {/* Seat */}
        <div className="space-y-3 py-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-sans text-base font-bold">Choose a seat</h2>
            <p className="text-sm font-bold" aria-live="polite">{taken.length} of 4 seats booked</p>
          </div>
          {people.length > 0 && (
            <div className="flex items-center gap-2.5">
              <span className="flex -space-x-2">{people.map((p, i) => <Avatar key={p} name={p} size={32} tone={(i % 3) as 0 | 1 | 2} />)}</span>
              <span className="text-sm text-fg-secondary">Riding with {people.slice(0, 2).join(" and ")}{people.length > 2 ? ` and ${people.length - 2} more` : ""}</span>
            </div>
          )}
          <CarSeatPicker taken={taken} value={seat} onChange={setSeat} />
        </div>
        {/* Rules */}
        <div className="py-4"><PolicyNote departAt={pickupTime} /></div>
      </section>

      <div className="h-24" aria-hidden="true" />
      <StickyCta summary={<p className="flex items-baseline justify-between text-sm"><span className="font-semibold text-fg-secondary">All-in price · fuel and service included</span><span className="font-display text-2xl font-extrabold">{formatNaira(price)}</span></p>}>
        <Button size="lg" full iconRight="arrowR" onClick={reserve} disabled={taken.includes(seat)}>Reserve seat · {formatNaira(price)}</Button>
      </StickyCta>

      <Dialog dialogRef={dlg.ref} title="Choose your drop-off stop">
        <p className="mb-3 text-sm text-fg-muted">Same trip, same price. Pick the stop closest to where you are going.</p>
        <div className="grid gap-2">
          {dropOptions.map((s) => (
            <div key={s.id} className="relative"><RadioCard name="dropoff" checked={dropoffId === s.id} onSelect={() => setDropoffId(s.id)} icon="flag" title={s.name} sub={`${s.landmark} · ${formatTime(addMinutes(trip.depart, minutesTo(trip, s.id)))}`} /></div>
          ))}
        </div>
        <Button size="lg" full className="mt-5" onClick={dlg.close}>Done</Button>
      </Dialog>
    </div>
  );
}
