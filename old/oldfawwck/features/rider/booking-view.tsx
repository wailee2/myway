"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CarArt } from "@/components/illustrations/vehicles";
import { QrCode } from "@/components/illustrations/qr-code";
import { PageHeader } from "@/components/layout/page-header";
import { MapCanvas } from "@/components/map/map-canvas";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog, RadioCard, useDialog } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Avatar, Badge, Banner, Card, EmptyState, SeatDots } from "@/components/ui/primitives";
import { getLine } from "@/lib/data/bus";
import { getStop } from "@/lib/data/stops";
import { getDriver, getTrip } from "@/lib/data/trips";
import { formatCountdown, formatNaira } from "@/lib/format";
import { useCountdown } from "@/lib/hooks/use-countdown";
import { useBooking } from "@/lib/store/booking";
import { SEAT_LABEL } from "@/lib/pricing";
import type { Booking, BookingProgress, SeatId } from "@/lib/types";

const ORDER: BookingProgress[] = ["confirmed", "arriving", "onboard", "arrived"];
const HEAD: Record<BookingProgress, { t: string; s: string }> = {
  confirmed: { t: "You’re booked!", s: "Your driver is on the way to the stop." },
  arriving: { t: "Your driver is at the stop", s: "Share your code and hop in." },
  onboard: { t: "You’re on your way", s: "Sit back. Your trip is shared with your trusted contacts." },
  arrived: { t: "You’ve arrived", s: "Thanks for riding. How was it?" },
};

export function BookingView({ id }: { id: string }) {
  const b = useBooking((s) => s.bookings.find((x) => x.id === id));
  if (!b) return <EmptyState title="We can’t find that booking" body="It may have been removed. Check your trips list." action={<ButtonLink href="/app/trips" icon="ticket">My trips</ButtonLink>}><CarArt className="w-40" /></EmptyState>;
  return b.kind === "car" ? <CarBooking b={b} /> : <BusTicket b={b} />;
}

/* ------------------------------ CAR ------------------------------ */
function CarBooking({ b }: { b: Booking }) {
  const { setProgress, cancel } = useBooking();
  const trip = getTrip(b.tripId ?? "");
  const driver = trip ? getDriver(trip.driverId) : undefined;
  const left = useCountdown(372);
  const dlg = useDialog();
  const [reason, setReason] = useState("Change of plans");
  const [copied, setCopied] = useState(false);
  const a = trip ? getStop(trip.fromId) : undefined;
  const z = trip ? getStop(trip.toId) : undefined;
  const cancelled = b.status === "cancelled";
  const idx = ORDER.indexOf(b.progress);

  const pos = a && z ? (b.progress === "confirmed" ? { x: a.x + 70, y: a.y - 55 } : b.progress === "arriving" ? { x: a.x, y: a.y } : b.progress === "onboard" ? { x: (a.x + z.x) / 2, y: (a.y + z.y) / 2 - 20 } : { x: z.x, y: z.y }) : { x: 0, y: 0 };
  const share = async () => {
    const text = `I'm riding with MYWAY: ${b.title}, leaving ${b.time}.`;
    try {
      if (navigator.share) await navigator.share({ title: "My MYWAY trip", text });
      else { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    } catch { /* user dismissed the share sheet */ }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_28rem] lg:gap-10">
      <div className="lg:hidden"><PageHeader title="My booking" back="/app/trips" /></div>
      <div className="relative h-60 overflow-hidden rounded-2xl border-2 border-outline lg:sticky lg:top-8 lg:order-2 lg:h-[calc(100dvh-7rem)]">
        {trip && <MapCanvas route={{ fromId: trip.fromId, toId: trip.toId }} markers={[{ ...pos, kind: "car" }]} label="Live map of your car" />}
        {!cancelled && b.progress !== "arrived" && <Badge tone="ink" icon="clock" className="absolute left-3 top-3 shadow-hard">{b.progress === "confirmed" ? "Arrives in 4 min" : b.progress === "arriving" ? "At your stop" : "18 min to go"}</Badge>}
      </div>

      <section aria-labelledby="bk-title" className="space-y-5 lg:order-1">
        <div className="hidden lg:block"><PageHeader title="My booking" back="/app/trips" /></div>
        {cancelled ? (
          <Banner tone="warning" icon="alert">This seat was cancelled.{b.payment === "wallet" ? ` ${formatNaira(b.total)} went back to your wallet.` : ""}</Banner>
        ) : (
          <div className="space-y-1.5" aria-live="polite">
            <h1 id="bk-title" className="text-display-md">{HEAD[b.progress].t}</h1>
            <p className="text-fg-muted">{HEAD[b.progress].s}</p>
          </div>
        )}

        {!cancelled && b.progress !== "arrived" && (
          <Card tone="primary" className="space-y-2 text-center">
            <p className="text-caption font-extrabold uppercase tracking-[0.14em]">Boarding code</p>
            <p className="font-display text-6xl font-extrabold tracking-[0.2em]">{b.code}</p>
            {b.progress === "confirmed" && <p className="text-sm font-semibold text-primary-fg/80">Leaves in {formatCountdown(left)} or when the car is full</p>}
          </Card>
        )}

        <Card className="space-y-3.5">
          <p className="font-bold">{b.title}</p>
          <dl className="grid grid-cols-3 gap-3 text-sm">
            {[["Departs", b.time], ["Seat", SEAT_LABEL[b.seat as SeatId] ?? b.seat], ["Paid", formatNaira(b.total)]].map(([k, v]) => <div key={k}><dt className="text-fg-muted">{k}</dt><dd className="font-bold">{v}</dd></div>)}
          </dl>
          {driver && (
            <div className="flex items-center gap-3 border-t border-line pt-3.5">
              <Avatar name={driver.name} size={44} />
              <div className="min-w-0 flex-1"><p className="font-bold">{driver.name}</p><p className="truncate text-sm text-fg-muted">{driver.car} · {driver.plate}</p></div>
              <a href="tel:+2340000000000" aria-label={`Call ${driver.name}`} className="pressable grid size-11 place-items-center rounded-full bg-surface-sunken"><Icon name="phone" size={20} /></a>
            </div>
          )}
          {trip && <div className="flex items-center gap-3 rounded-lg bg-surface-sunken p-3"><SeatDots taken={Math.min(4, trip.taken.length + 1)} /><span className="text-sm font-semibold">{trip.taken.length + 1} of 4 seats filled</span></div>}
        </Card>

        {!cancelled && (
          <div className="rounded-xl border-2 border-dashed border-line-strong/40 p-4" role="group" aria-label="Demo controls">
            <p className="mb-2.5 text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Demo: move the trip along</p>
            <div className="rail">
              {ORDER.map((p, i) => (
                <button key={p} type="button" aria-pressed={b.progress === p} onClick={() => setProgress(b.id, p)} className={`pressable h-10 rounded-full px-4 text-[0.8125rem] font-bold ${i <= idx ? "bg-secondary text-secondary-fg" : "border border-line bg-surface-sunken"}`}>{["Booked", "Driver at stop", "On board", "Arrived"][i]}</button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {b.progress === "arrived" && !cancelled && <ButtonLink href={`/app/rate/${b.id}`} icon="star" className="sm:col-span-2">{b.rating ? "Edit your rating" : "Rate your ride"}</ButtonLink>}
          <Button variant="outline" icon="share" onClick={share}>{copied ? "Copied to clipboard" : "Share trip"}</Button>
          <ButtonLink href="/app/safety" variant="outline" icon="shield">Safety tools</ButtonLink>
          {!cancelled && (b.progress === "confirmed" || b.progress === "arriving") && <Button variant="danger" onClick={dlg.open} className="sm:col-span-2">Cancel seat</Button>}
        </div>
      </section>

      <Dialog dialogRef={dlg.ref} title="Cancel your seat?">
        <Banner tone="success" icon="check" className="mb-4">Free cancellation. {b.payment === "wallet" ? `${formatNaira(b.total)} goes back to your wallet instantly.` : "Your hold is released."}</Banner>
        <div className="grid gap-2">
          {["Change of plans", "Found another ride", "Driver is running late", "Other"].map((r) => (
            <div key={r} className="relative"><RadioCard name="reason" checked={reason === r} onSelect={() => setReason(r)} title={r} /></div>
          ))}
        </div>
        <div className="mt-5 grid gap-2.5">
          <Button full onClick={dlg.close}>Keep my seat</Button>
          <Button full variant="danger" onClick={() => { cancel(b.id); dlg.close(); }}>Cancel seat</Button>
        </div>
      </Dialog>
    </div>
  );
}

/* ------------------------------ BUS ------------------------------ */
function BusTicket({ b }: { b: Booking }) {
  const line = getLine(b.lineId ?? "");
  const cancel = useBooking((s) => s.cancel);
  const ref = useRef<HTMLDialogElement>(null);
  const cancelled = b.status === "cancelled";
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Your ticket" back="/app/trips" />
      {cancelled && <Banner tone="warning" icon="alert" className="mb-4">This ticket was cancelled and refunded.</Banner>}
      <article className={`sticker-lg overflow-hidden rounded-2xl bg-primary text-primary-fg ${cancelled ? "opacity-60" : ""}`}>
        <div className="flex items-center justify-between gap-4 p-6">
          <span className="grid size-14 place-items-center rounded-[1rem] bg-secondary font-display text-xl font-extrabold text-primary">{line?.id}</span>
          <p className="font-display text-5xl font-extrabold tracking-[-0.04em]">{b.time}</p>
        </div>
        <div className="px-6 pb-5"><p className="text-lg font-bold">{line?.from} → {line?.to}</p><p className="text-sm font-semibold text-primary-fg/75">Today · {line?.bus}</p></div>
        <div className="relative bg-surface px-6 py-6 text-fg">
          <span aria-hidden="true" className="absolute -top-3 left-0 size-6 -translate-x-1/2 rounded-full bg-primary" />
          <span aria-hidden="true" className="absolute -top-3 right-0 size-6 translate-x-1/2 rounded-full bg-primary" />
          <div className="mx-auto grid place-items-center"><QrCode seed={b.id.length * 13 + 5} label={`QR ticket for seat ${b.seat}`} /></div>
          <dl className="mt-5 flex justify-between">
            {[["Seat", b.seat], ["Bay", "3"], ["Paid", formatNaira(b.total)]].map(([k, v]) => <div key={k}><dt className="text-sm text-fg-muted">{k}</dt><dd className="font-display text-2xl font-extrabold">{v}</dd></div>)}
          </dl>
        </div>
      </article>
      <p className="mt-4 text-center text-sm text-fg-muted">Show this QR to the marshal when boarding.</p>
      {!cancelled && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ButtonLink href={`/app/bus/${line?.id}`} variant="outline" icon="nav">Line timetable</ButtonLink>
          <Button variant="danger" onClick={() => ref.current?.showModal()}>Cancel ticket</Button>
        </div>
      )}
      <Dialog dialogRef={ref} title="Cancel this ticket?">
        <p className="mb-5 text-fg-muted">Your seat goes back on sale and {formatNaira(b.total)} returns to your wallet.</p>
        <div className="grid gap-2.5"><Button full onClick={() => ref.current?.close()}>Keep my ticket</Button><Button full variant="danger" onClick={() => { cancel(b.id); ref.current?.close(); }}>Cancel ticket</Button></div>
      </Dialog>
      <p className="mt-6 text-center"><Link href="/app/trips" className="font-bold underline">Back to my trips</Link></p>
    </div>
  );
}
