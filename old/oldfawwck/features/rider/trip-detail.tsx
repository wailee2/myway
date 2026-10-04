"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CarArt } from "@/components/illustrations/vehicles";
import { MapCanvas } from "@/components/map/map-canvas";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Avatar, Badge, Card, EmptyState } from "@/components/ui/primitives";
import { PageHeader } from "@/components/layout/page-header";
import { stopName } from "@/lib/data/stops";
import { getDriver, getTrip } from "@/lib/data/trips";
import { formatNaira } from "@/lib/format";
import { seatFare } from "@/lib/pricing";
import { useBooking } from "@/lib/store/booking";
import type { SeatId } from "@/lib/types";
import { CarSeatPicker } from "./car-seat-picker";

export function TripDetail({ id }: { id: string }) {
  const router = useRouter();
  const setDraft = useBooking((s) => s.setDraft);
  const trip = getTrip(id);
  const [seat, setSeat] = useState<SeatId>(() => {
    if (!trip) return "back-m";
    const order: SeatId[] = ["back-m", "back-l", "back-r", "front"];
    return order.find((s) => !trip.taken.includes(s)) ?? "back-m";
  });

  if (!trip) {
    return <EmptyState title="That trip has left" body="This car is no longer available. Pick another from the list." action={<ButtonLink href="/app" icon="search">Find a car</ButtonLink>}><CarArt className="w-40" /></EmptyState>;
  }
  const d = getDriver(trip.driverId);
  const price = seatFare(trip.price, seat);
  const proceed = () => {
    setDraft({ tripId: trip.id, seat, from: trip.fromId, to: trip.toId, payment: "wallet" });
    router.push("/app/checkout?kind=car");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_28rem] lg:gap-10">
      <div className="lg:hidden"><PageHeader title="Trip details" back={`/app/search?from=${trip.fromId}&to=${trip.toId}`} /></div>
      <div className="h-56 overflow-hidden rounded-2xl border-2 border-outline lg:sticky lg:top-8 lg:order-2 lg:h-[calc(100dvh-7rem)]">
        <MapCanvas route={{ fromId: trip.fromId, toId: trip.toId }} label={`Route from ${stopName(trip.fromId)} to ${stopName(trip.toId)}`} />
      </div>
      <section aria-labelledby="trip-title" className="space-y-5 lg:order-1">
        <div className="hidden lg:block"><PageHeader title="Trip details" back={`/app/search?from=${trip.fromId}&to=${trip.toId}`} /></div>
        <h2 id="trip-title" className="sr-only">{stopName(trip.fromId)} to {stopName(trip.toId)}</h2>
        <Card tone="default" className="space-y-4 p-5">
          {([["Pickup", stopName(trip.fromId), trip.depart], ["Drop-off", stopName(trip.toId), trip.arrive]] as const).map(([l, n, t], i) => (
            <div key={l} className="flex items-center gap-4">
              <span className={i === 0 ? "size-4 rounded-full border-[3.5px] border-outline bg-primary" : "size-4 rounded-[4px] bg-outline"} />
              <div className="flex-1"><p className="text-caption font-semibold text-fg-muted">{l}</p><p className="font-bold">{n}</p></div>
              <p className="font-display text-2xl font-extrabold tracking-[-0.03em]">{t}</p>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
            <Badge tone="primary" icon="clock">{trip.tag}</Badge>
            {trip.womenOnly && <Badge tone="info" icon="shield">Women-only</Badge>}
          </div>
        </Card>
        <Card tone="soft" className="flex items-center gap-3.5">
          <Avatar name={d.name} size={48} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 font-bold">{d.name}<Icon name="badge" size={16} className="text-success" strokeWidth={2.4} /></p>
            <p className="text-sm text-fg-muted">{d.rating} ★ · {d.trips} trips · {d.plate}</p>
            <p className="text-sm text-fg-muted">{d.car}</p>
          </div>
          <Icon name="shield" size={22} className="text-success" />
        </Card>
        <div className="space-y-2.5">
          <h3 className="font-sans text-base font-bold">Choose your seat</h3>
          <CarSeatPicker taken={trip.taken} value={seat} onChange={setSeat} base={trip.price} />
        </div>
        <Button size="lg" full iconRight="arrowR" onClick={proceed} disabled={trip.taken.includes(seat)}>Reserve seat · {formatNaira(price)}</Button>
      </section>
    </div>
  );
}
