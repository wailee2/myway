"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CarArt } from "@/components/illustrations/vehicles";
import { QrCode } from "@/components/illustrations/qr-code";
import { PageHeader } from "@/components/layout/page-header";
import { MapCanvas } from "@/components/map/map-canvas";
import { Button, ButtonLink } from "@/components/ui/button";
import { DemoPanel } from "@/components/ui/demo-panel";
import { Dialog, RadioCard, useDialog } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Avatar, Badge, Banner, Card, Chip, EmptyState, Eyebrow, SeatDots } from "@/components/ui/primitives";
import { track } from "@/lib/analytics";
import { LIVE } from "@/lib/api/live";
import { searchRides } from "@/lib/api/rides";
import type { RideMatch } from "@/lib/data/trips";
import { getLine } from "@/lib/data/bus";
import { getRoute, getStop } from "@/lib/data/stops";
import { alternativesFor, coRiders, getDriver, getTrip, meetBy, minutesTo } from "@/lib/data/trips";
import { addMinutes, formatNaira, formatTime, ratingLabel, timeAgoLabel, WEEKDAY_SHORT, WEEKDAYS } from "@/lib/format";
import { useOnline } from "@/lib/hooks/use-online";
import { COPY, POLICY } from "@/lib/policy";
import { SEAT_LONG } from "@/lib/pricing";
import { refundsOnCancel, useBooking } from "@/lib/store/booking";
import { useRider } from "@/lib/store/rider";
import type { Booking, BookingProgress, SeatId } from "@/lib/types";
import { cn } from "@/lib/cn";
import { CallSheet, QuickMessages } from "./comms";
import { PolicyNote } from "./policy-note";
import { ReportSheet } from "./report-sheet";

const STEPS: { id: BookingProgress; label: string }[] = [
  { id: "assigned", label: "Assigned" },
  { id: "on_the_way", label: "On the way" },
  { id: "arriving", label: "Arriving" },
  { id: "boarded", label: "Boarded" },
  { id: "dropped_off", label: "Dropped off" },
];

export function BookingView({ id }: { id: string }) {
  const b = useBooking((s) => s.bookings.find((x) => x.id === id));
  if (!b) return <EmptyState title="We can’t find that booking" body="It may have been removed. Check your trips list." action={<ButtonLink href="/app/trips" icon="ticket">My trips</ButtonLink>}><CarArt className="w-40" /></EmptyState>;
  return b.kind === "car" ? <CarBooking b={b} /> : <BusTicket b={b} />;
}

function OfflineNote({ at }: { at: number }) {
  const online = useOnline();
  if (online) return null;
  return <Banner tone="warning" icon="alert"><p className="font-extrabold">You’re offline</p><p>Showing the details saved on this phone at {timeAgoLabel(at)}. Status may be out of date. Your pickup, plate and boarding code are still here.</p></Banner>;
}

/* ------------------------------ CAR ------------------------------ */
function CarBooking({ b }: { b: Booking }) {
  const { setProgress, cancel, markLate, driverCancel, markNoShow } = useBooking();
  const usual = useRider((s) => s.usualRoutes);
  const saveUsual = useRider((s) => s.saveUsual);
  const trip = getTrip(b.tripId ?? "");
  const driver = trip ? getDriver(trip.driverId) : undefined;
  const pickup = getStop(b.pickupId ?? "");
  const dropoff = getStop(b.dropoffId ?? "");
  const route = trip ? getRoute(trip.routeId) : undefined;
  const cancelDlg = useDialog();
  const callDlg = useDialog();
  const reportDlg = useDialog();
  const [reason, setReason] = useState("Change of plans");
  const [showMap, setShowMap] = useState(true);
  const [copied, setCopied] = useState(false);
  const [usualDays, setUsualDays] = useState([0, 1, 2, 3, 4]);
  const [actionError, setActionError] = useState("");
  const [liveAlternatives, setLiveAlternatives] = useState<RideMatch[]>([]);

  const cancelled = b.status === "cancelled";
  const active = b.status === "upcoming";
  const idx = STEPS.findIndex((s) => s.id === b.progress);
  const dropTime = trip && b.dropoffId ? addMinutes(trip.depart, minutesTo(trip, b.dropoffId)) : "";
  const alreadyUsual = usual.some((u) => u.fromId === b.pickupId && u.toId === b.dropoffId);
  const canTalk = active || (b.progress === "dropped_off" && Date.now() - b.updatedAt <= POLICY.callWindowAfterDropoffMinutes * 60_000) || (b.progress === "dropped_off" && !cancelled && b.rating === undefined);
  const stopIds = route?.stops.map((s) => s.stopId) ?? [];
  const via = pickup && dropoff ? stopIds.slice(stopIds.indexOf(pickup.id), stopIds.indexOf(dropoff.id) + 1) : [];
  const wantsAlternatives = cancelled && b.cancelledBy === "driver" && Boolean(trip) && Boolean(b.pickupId) && Boolean(b.dropoffId);
  const alternatives = wantsAlternatives ? (LIVE ? liveAlternatives : alternativesFor(trip!.id, b.pickupId!, b.dropoffId!, b.dayOffset ?? 0)) : [];
  const free = refundsOnCancel(b);

  // With the backend on, "other rides for your route" comes from a real search.
  useEffect(() => {
    if (!LIVE || !wantsAlternatives || !b.pickupId || !b.dropoffId) return;
    let alive = true;
    searchRides({ from: b.pickupId, to: b.dropoffId, day: b.dayOffset ?? 0 }, [])
      .then((rs) => { if (alive) setLiveAlternatives(rs.filter((m) => m.trip.id !== b.tripId && m.seatsLeft > 0).slice(0, 3)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [wantsAlternatives, b.pickupId, b.dropoffId, b.dayOffset, b.tripId]);

  const mapPos = pickup && dropoff
    ? b.progress === "assigned" ? { x: pickup.x + 60, y: pickup.y - 45 } : b.progress === "on_the_way" ? { x: pickup.x + 30, y: pickup.y - 20 } : b.progress === "arriving" ? { x: pickup.x, y: pickup.y } : b.progress === "boarded" ? { x: (pickup.x + dropoff.x) / 2, y: (pickup.y + dropoff.y) / 2 - 20 } : { x: dropoff.x, y: dropoff.y }
    : null;

  const share = async () => {
    const text = `I’m riding with MYWAY: ${b.title}, leaving ${formatTime(b.time)}${driver ? `. ${driver.color} ${driver.make}, ${driver.plate}` : ""}.`;
    try {
      if (navigator.share) await navigator.share({ title: "My MYWAY trip", text });
      else { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    } catch { /* user dismissed the share sheet */ }
  };

  const HEAD: Record<BookingProgress, { t: string; s: string }> = {
    assigned: { t: "You’re booked", s: `Be at ${pickup?.name ?? "the stop"} by ${formatTime(meetBy(b.time))}. We’ll tell you when your driver is on the way.` },
    on_the_way: { t: "Your driver is on the way", s: "Head to the stop now so you’re ready." },
    arriving: { t: "Your driver is arriving", s: "Look for the plate below, then show your boarding code." },
    boarded: { t: "You’re on your way", s: "Sit back. You can share your trip from Safety." },
    dropped_off: { t: "You’ve arrived", s: "Thanks for riding. How was it?" },
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="My booking" back="/app/trips" />
      <OfflineNote at={b.updatedAt} />
      {actionError && <Banner tone="danger" icon="alert">{actionError}</Banner>}

      {/* Status headline */}
      {cancelled ? (
        <div className="space-y-2">
          {b.cancelledBy === "driver" && <Banner tone="danger" icon="alert"><p className="font-extrabold">Your driver cancelled</p><p>{b.payment === "cash" ? "Your seat hold is back in your wallet." : `${formatNaira(b.total)} is back in your wallet.`} {COPY.driverCancelled}</p></Banner>}
          {b.cancelledBy === "no_show" && <Banner tone="warning" icon="alert"><p className="font-extrabold">Your seat was released</p><p>{COPY.noShow}</p></Banner>}
          {b.cancelledBy === "rider" && <Banner tone="warning" icon="alert"><p>You cancelled this seat.{b.payment === "wallet" ? (free ? ` ${formatNaira(b.total)} went back to your wallet.` : " The fare was not refunded because it was after the free cancellation window.") : ""}</p></Banner>}
        </div>
      ) : (
        <div className="space-y-1.5" aria-live="polite">
          <h1 id="bk-title" className="text-display-md">{HEAD[b.progress].t}</h1>
          <p className="text-fg-secondary">{HEAD[b.progress].s}</p>
        </div>
      )}

      {!cancelled && (
        <ol className="flex items-start" aria-label="Booking progress">
          {STEPS.map((s, i) => (
            <li key={s.id} className="flex flex-1 flex-col items-center gap-1.5 text-center" aria-current={i === idx ? "step" : undefined}>
              <span className="flex w-full items-center"><span className={cn("h-1 flex-1", i === 0 ? "bg-transparent" : i <= idx ? "bg-secondary" : "bg-line")} /><span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2 border-outline", i <= idx ? "bg-primary" : "bg-surface")}>{i < idx && <Icon name="check" size={13} strokeWidth={3.5} />}</span><span className={cn("h-1 flex-1", i === STEPS.length - 1 ? "bg-transparent" : i < idx ? "bg-secondary" : "bg-line")} /></span>
              <span className={cn("text-xs leading-tight", i === idx ? "font-extrabold" : "font-semibold text-fg-muted")}>{s.label}</span>
            </li>
          ))}
        </ol>
      )}

      {/* Late */}
      {active && b.lateMinutes ? (
        <Banner tone="warning" icon="clock"><p className="font-extrabold">Your driver is running about {b.lateMinutes} minutes late</p><p>New pickup time: {formatTime(addMinutes(b.time, b.lateMinutes))}. You can message or call the driver below, or cancel if it no longer works.</p></Banner>
      ) : null}

      {/* Pickup + vehicle: the offline-critical block */}
      {!cancelled && b.progress !== "dropped_off" && driver && pickup && (
        <section aria-label="Pickup details" className="space-y-4 rounded-xl border-2 border-outline bg-surface p-4">
          <div className="space-y-1">
            <Eyebrow>Your car</Eyebrow>
            <p className="font-display text-4xl font-extrabold tracking-[0.02em]" aria-label={`Number plate ${driver.plate}`}>{driver.plate}</p>
            <p className="text-xl font-bold">{driver.color} {driver.make}</p>
          </div>
          <div className="flex items-start gap-3 border-t border-line pt-3.5">
            <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-[0.8rem] bg-primary text-primary-fg"><Icon name="pin" size={20} /></span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{pickup.name}</p>
              <p className="text-fg-secondary">{pickup.landmark}. Wait at the stop; the driver will find you there.</p>
              <p className="mt-1 font-bold">Be there by {formatTime(meetBy(b.time))} · leaves {formatTime(addMinutes(b.time, b.lateMinutes ?? 0))}</p>
            </div>
          </div>
          <div className="sticker-lg rounded-xl bg-primary p-4 text-center text-primary-fg">
            <p className="text-caption font-extrabold uppercase tracking-[0.14em]">Boarding code</p>
            <p className="font-display text-6xl font-extrabold tracking-[0.2em]">{b.code}</p>
            <p className="text-sm font-semibold">Show this to the driver when you get in.</p>
          </div>
        </section>
      )}

      {/* Map */}
      {trip && pickup && dropoff && !cancelled && b.progress !== "dropped_off" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between"><Eyebrow>Route</Eyebrow><button type="button" onClick={() => setShowMap((v) => !v)} aria-expanded={showMap} className="min-h-11 px-2 text-sm font-extrabold underline underline-offset-4">{showMap ? "Hide map" : "Show map"}</button></div>
          {showMap && (
            <div className="relative h-44 overflow-hidden rounded-2xl border-2 border-outline">
              <MapCanvas route={{ fromId: pickup.id, toId: dropoff.id, via }} markers={mapPos ? [{ ...mapPos, kind: "car" }] : []} label="Map of your pickup and route" />
            </div>
          )}
        </div>
      )}

      {/* Details */}
      <Card className="space-y-3.5">
        <p className="font-bold">{b.title}</p>
        <dl className="grid grid-cols-3 gap-3 text-sm">
          {[["Departs", formatTime(b.time)], ["Seat", SEAT_LONG[b.seat as SeatId]?.replace("Back row, ", "Back, ") ?? b.seat], ["Paid", formatNaira(b.total)]].map(([k, v]) => <div key={k}><dt className="text-fg-muted">{k}</dt><dd className="font-bold">{v}</dd></div>)}
        </dl>
        {driver && (
          <div className="flex items-center gap-3 border-t border-line pt-3.5">
            <Avatar name={driver.name} size={44} />
            <div className="min-w-0 flex-1"><p className="font-bold">{driver.name}</p><p className="truncate text-sm text-fg-muted">{ratingLabel(driver.rating)} · ID verified</p></div>
            {canTalk && !cancelled && <button type="button" onClick={callDlg.open} aria-label={`Call ${driver.name}. Your number stays private.`} className="pressable grid size-12 place-items-center rounded-full bg-secondary text-primary"><Icon name="phone" size={20} /></button>}
          </div>
        )}
        {trip && !cancelled && (
          <div className="flex items-center gap-3 rounded-lg bg-surface-sunken p-3"><SeatDots taken={Math.min(4, trip.taken.length + (trip.live ? 0 : 1))} /><span className="text-sm font-semibold">{Math.min(4, trip.taken.length + (trip.live ? 0 : 1))} of 4 seats booked{coRiders(trip, b.dayOffset ?? 0).length ? ` · with ${coRiders(trip, b.dayOffset ?? 0).slice(0, 2).join(", ")}` : ""}</span></div>
        )}
      </Card>

      {/* Rules */}
      {active && b.progress !== "boarded" && trip && <Card tone="soft"><PolicyNote departAt={b.time} /></Card>}

      {/* Communication */}
      {active && driver && b.progress !== "boarded" && <QuickMessages bookingId={b.id} driverName={driver.name} />}

      {/* Driver cancelled: alternatives */}
      {cancelled && b.cancelledBy === "driver" && (
        <section aria-labelledby="alt-title" className="space-y-3">
          <h2 id="alt-title" className="text-title">Other rides for your route</h2>
          {alternatives.length ? (
            <ul className="grid gap-2.5">
              {alternatives.map((m) => (
                <li key={m.trip.id}><Link href={`/app/trip/${m.trip.id}?from=${m.pickup.id}&to=${m.dropoff.id}&day=${b.dayOffset ?? 0}`} className="pressable flex min-h-16 items-center gap-3 rounded-xl border-2 border-line bg-surface p-3.5 hover:border-line-strong"><span className="font-display text-xl font-extrabold">{formatTime(m.pickupTime)}</span><span className="flex-1 text-sm font-semibold text-fg-secondary">{getDriver(m.trip.driverId).name.split(" ")[0]} · {m.seatsLeft} seat{m.seatsLeft > 1 ? "s" : ""} left</span><span className="font-display text-lg font-extrabold">{formatNaira(m.trip.price)}</span></Link></li>
              ))}
            </ul>
          ) : <p className="text-fg-muted">No other rides on this route right now. Try another time.</p>}
          <ButtonLink href={`/app/search?from=${b.pickupId}&to=${b.dropoffId}`} full variant="outline" icon="search">Search again</ButtonLink>
        </section>
      )}

      {/* Drop-off summary + receipt */}
      {b.progress === "dropped_off" && !cancelled && (
        <section aria-labelledby="sum-title" className="space-y-4">
          <Card className="space-y-3">
            <h2 id="sum-title" className="text-title">Trip summary</h2>
            <div className="flex items-start gap-3"><span className="mt-1 grid size-9 shrink-0 place-items-center rounded-[0.7rem] bg-surface-sunken"><Icon name="flag" size={18} /></span><div><p className="text-sm text-fg-muted">Drop-off point</p><p className="font-bold">{dropoff?.name}</p><p className="text-sm text-fg-secondary">{dropoff?.landmark}</p></div></div>
            <dl className="grid grid-cols-2 gap-3 border-t border-line pt-3 text-sm">
              <div><dt className="text-fg-muted">Left</dt><dd className="font-bold">{formatTime(b.time)}</dd></div>
              <div><dt className="text-fg-muted">Arrived</dt><dd className="font-bold">{dropTime ? formatTime(dropTime) : "On time"}</dd></div>
              <div><dt className="text-fg-muted">Driver</dt><dd className="font-bold">{driver?.name}</dd></div>
              <div><dt className="text-fg-muted">Vehicle</dt><dd className="font-bold">{driver?.plate}</dd></div>
            </dl>
          </Card>
          <Card tone="soft" className="space-y-2 font-semibold">
            <p className="flex items-center justify-between"><span>Receipt MW-{b.id.slice(-5).toUpperCase()}</span><span className="text-sm text-fg-muted">{b.dateLabel}</span></p>
            <p className="flex justify-between text-fg-secondary"><span>Ride · {SEAT_LONG[b.seat as SeatId]?.replace("Back row, ", "Back, ")}</span><span>{formatNaira(b.total)}</span></p>
            {b.tip ? <p className="flex justify-between text-fg-secondary"><span>Tip</span><span>{formatNaira(b.tip)}</span></p> : null}
            <p className="flex justify-between border-t border-line pt-2 font-extrabold"><span>Total paid</span><span>{formatNaira(b.total + (b.tip ?? 0))}</span></p>
            <p className="text-sm font-medium text-fg-muted">Paid with {b.payment === "wallet" ? "MYWAY wallet" : b.payment === "cash" ? "cash to driver" : b.payment}. Service and fuel are included in the price.</p>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2">
            <ButtonLink href={`/app/rate/${b.id}`} icon="star" className="sm:col-span-2">{b.rating ? "Edit your rating" : "Rate your ride"}</ButtonLink>
            <Button variant="outline" icon="flag" onClick={reportDlg.open} className="sm:col-span-2">Report a problem</Button>
          </div>
        </section>
      )}

      {/* Usual ride */}
      {!cancelled && !alreadyUsual && b.pickupId && b.dropoffId && (
        <Card tone="soft" className="space-y-3">
          <p className="font-extrabold">Make this your usual ride?</p>
          <p className="text-sm text-fg-secondary">We’ll show it on Home and tell you when it’s available, around {formatTime(b.time)}.</p>
          <div className="flex gap-1.5" role="group" aria-label="Days you travel">
            {WEEKDAY_SHORT.map((d, i) => { const on = usualDays.includes(i); return <button key={i} type="button" aria-pressed={on} aria-label={WEEKDAYS[i]} onClick={() => setUsualDays((v) => on ? v.filter((x) => x !== i) : [...v, i])} className={cn("pressable size-11 rounded-full font-bold", on ? "bg-secondary text-primary" : "bg-surface text-fg-muted border border-line")}>{d}</button>; })}
          </div>
          <Button size="md" disabled={!usualDays.length} onClick={() => { saveUsual({ fromId: b.pickupId!, toId: b.dropoffId!, days: usualDays, time: b.time }); track("usual_saved"); }}>Save as usual ride</Button>
        </Card>
      )}
      {alreadyUsual && !cancelled && <p className="flex items-center gap-2 text-sm font-semibold text-success-text"><Icon name="check" size={16} strokeWidth={3} />This is one of your usual rides.</p>}

      {/* Actions */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="outline" icon="share" onClick={share}>{copied ? "Copied to clipboard" : "Share trip"}</Button>
        <ButtonLink href="/app/safety" variant="outline" icon="shield">Safety</ButtonLink>
        {active && (b.progress === "assigned" || b.progress === "on_the_way" || b.progress === "arriving") && <Button variant="danger" onClick={cancelDlg.open} className="sm:col-span-2">Cancel seat</Button>}
        {cancelled && <Button variant="outline" icon="flag" onClick={reportDlg.open} className="sm:col-span-2">Report a problem</Button>}
      </div>

      <DemoPanel title="Demo: move the trip along">
        <div className="rail">
          {STEPS.map((s, i) => <Chip key={s.id} active={b.progress === s.id} className={i <= idx && b.progress !== s.id ? "bg-secondary/80 text-secondary-fg" : ""} onClick={() => setProgress(b.id, s.id)}>{s.label}</Chip>)}
        </div>
        {active && (
          <div className="rail mt-2.5">
            <Chip icon="clock" onClick={() => markLate(b.id, 10)}>Driver late</Chip>
            <Chip icon="x" onClick={() => driverCancel(b.id)}>Driver cancels</Chip>
            <Chip icon="user" onClick={() => markNoShow(b.id)}>Rider no-show</Chip>
          </div>
        )}
      </DemoPanel>

      {driver && <CallSheet dialogRef={callDlg.ref} driverName={driver.name} bookingId={b.id} />}
      <ReportSheet dialogRef={reportDlg.ref} bookingId={b.id} />

      <Dialog dialogRef={cancelDlg.ref} title="Cancel your seat?">
        <Banner tone={free ? "success" : "warning"} icon={free ? "check" : "alert"} className="mb-4">
          {free ? `${b.payment === "wallet" ? `${formatNaira(b.total)} goes back to your wallet instantly.` : "Your hold is released."}` : "This is inside the no-refund window, so the fare won’t be returned."}
        </Banner>
        <p className="mb-4 text-sm text-fg-secondary">{COPY.cancellation}</p>
        <div className="grid gap-2">
          {["Change of plans", "Found another ride", "Driver is running late", "Other"].map((r) => <div key={r} className="relative"><RadioCard name="reason" checked={reason === r} onSelect={() => setReason(r)} title={r} /></div>)}
        </div>
        <div className="mt-5 grid gap-2.5">
          <Button full onClick={cancelDlg.close}>Keep my seat</Button>
          <Button full variant="danger" onClick={async () => { cancelDlg.close(); const r = await cancel(b.id); setActionError(r.ok ? "" : r.message); }}>Cancel seat</Button>
        </div>
      </Dialog>
    </div>
  );
}

/* ------------------------------ BUS ------------------------------ */
function BusTicket({ b }: { b: Booking }) {
  const line = getLine(b.lineId ?? "");
  const cancel = useBooking((s) => s.cancel);
  const dlg = useDialog();
  const cancelled = b.status === "cancelled";
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Your ticket" back="/app/trips" />
      <div className="mb-4 space-y-3">
        <OfflineNote at={b.updatedAt} />
        {cancelled && <Banner tone="warning" icon="alert">This ticket was cancelled and refunded.</Banner>}
      </div>
      <article className={cn("sticker-lg overflow-hidden rounded-2xl bg-primary text-primary-fg", cancelled && "opacity-60")}>
        <div className="flex items-center justify-between gap-4 p-6">
          <span className="grid size-14 place-items-center rounded-[1rem] bg-secondary font-display text-xl font-extrabold text-primary">{line?.id}</span>
          <p className="font-display text-4xl font-extrabold tracking-[-0.04em]">{formatTime(b.time)}</p>
        </div>
        <div className="px-6 pb-5"><p className="text-lg font-bold">{line?.from} → {line?.to}</p><p className="text-sm font-semibold text-primary-fg/75">{b.dateLabel} · {line?.bus}</p></div>
        <div className="relative bg-surface px-6 py-6 text-fg">
          <span aria-hidden="true" className="absolute -top-3 left-0 size-6 -translate-x-1/2 rounded-full bg-primary" />
          <span aria-hidden="true" className="absolute -top-3 right-0 size-6 translate-x-1/2 rounded-full bg-primary" />
          <div className="mx-auto grid place-items-center"><QrCode seed={b.id.length * 13 + 5} label={`QR ticket for seat ${b.seat}`} /></div>
          <p className="mt-3 text-center font-display text-2xl font-extrabold tracking-[0.15em]">{b.code}</p>
          <dl className="mt-4 flex justify-between">
            {[["Seat", b.seat], ["Paid", formatNaira(b.total)]].map(([k, v]) => <div key={k}><dt className="text-sm text-fg-muted">{k}</dt><dd className="font-display text-2xl font-extrabold">{v}</dd></div>)}
          </dl>
        </div>
      </article>
      <p className="mt-4 text-center text-sm text-fg-secondary">Show this QR to the marshal when boarding. It works offline: this ticket is saved on your phone.</p>
      {!cancelled && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ButtonLink href={`/app/bus/${line?.id}`} variant="outline" icon="nav">Line timetable</ButtonLink>
          <Button variant="danger" onClick={dlg.open}>Cancel ticket</Button>
        </div>
      )}
      <Dialog dialogRef={dlg.ref} title="Cancel this ticket?">
        <p className="mb-5 text-fg-muted">Your seat goes back on sale and {formatNaira(b.total)} returns to your wallet.</p>
        <div className="grid gap-2.5"><Button full onClick={dlg.close}>Keep my ticket</Button><Button full variant="danger" onClick={() => { cancel(b.id); dlg.close(); }}>Cancel ticket</Button></div>
      </Dialog>
      <p className="mt-6 text-center"><Link href="/app/trips" className="inline-flex min-h-11 items-center font-bold underline">Back to my trips</Link></p>
    </div>
  );
}
