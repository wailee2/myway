"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { StickyCta } from "@/components/layout/sticky-cta";
import { Button, ButtonLink } from "@/components/ui/button";
import { RadioCard, useDialog } from "@/components/ui/form";
import { Banner, Card, EmptyState, Eyebrow } from "@/components/ui/primitives";
import { DEMO } from "@/lib/demo";
import { LIVE } from "@/lib/api/live";
import { useTrip } from "@/lib/hooks/use-trip";
import { getLine } from "@/lib/data/bus";
import { getStop } from "@/lib/data/stops";
import { formatNaira, formatTime } from "@/lib/format";
import { allInPrice, busQuote, CASH_HOLD, SEAT_LABEL } from "@/lib/pricing";
import { COPY } from "@/lib/policy";
import { useBooking } from "@/lib/store/booking";
import { useSession } from "@/lib/store/session";
import type { BookingResult, PaymentMethod } from "@/lib/types";
import { PolicyNote } from "./policy-note";
import { VerifyIdSheet } from "./verify-id";

type Failure = Extract<BookingResult, { ok: false }>;

export function Checkout({ kind }: { kind: "car" | "bus" }) {
  const router = useRouter();
  const { draft, balance, setDraft, confirmCar, confirmBus } = useBooking();
  const needsId = useSession((s) => s.role === "rider" && !s.idVerified);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [busy, setBusy] = useState(false);
  const idDlg = useDialog();

  const { trip, driver, loading } = useTrip(kind === "car" ? draft.tripId : undefined);
  const line = kind === "bus" && draft.lineId ? getLine(draft.lineId) : undefined;
  if (loading) return <div className="mx-auto max-w-2xl space-y-4 pt-4" role="status" aria-busy="true"><div className="h-24 animate-pulse rounded-xl bg-surface-sunken" /><div className="h-48 animate-pulse rounded-xl bg-surface-sunken" /></div>;
  if ((kind === "car" && (!trip || !draft.pickupId || !draft.dropoffId)) || (kind === "bus" && (!line || draft.busSeats.length === 0))) {
    return <EmptyState title="Nothing to reserve yet" body="Choose a ride and a seat first, then come back." action={<ButtonLink href={kind === "car" ? "/app" : "/app/bus"} icon="search">{kind === "car" ? "Find a ride" : "See bus lines"}</ButtonLink>} />;
  }

  const total = trip ? allInPrice(trip, draft.seat, draft.pickupId, draft.dropoffId) : busQuote(line!.price, draft.busSeats.length).total;
  const method = draft.payment;
  const walletShort = Math.max(0, total - balance);
  const dueNow = method === "cash" ? CASH_HOLD : total;
  const cashShort = method === "cash" && balance < CASH_HOLD;
  // Bus tickets and card/transfer payments are not connected to the server yet.
  const busUnavailable = LIVE && kind === "bus";
  const blocked = (method === "wallet" && walletShort > 0) || cashShort || busUnavailable;
  const pickup = getStop(draft.pickupId ?? "");
  const dropoff = getStop(draft.dropoffId ?? "");
  const topUpHref = (amount: number) => `/app/wallet/top-up?amount=${amount}&return=/app/checkout?kind=${kind}`;

  const methods: { id: PaymentMethod; icon: "wallet" | "bank" | "card" | "cash"; title: string; sub: string; car?: boolean }[] = [
    { id: "wallet", icon: "wallet", title: "MYWAY wallet", sub: walletShort > 0 ? `${formatNaira(balance)} available · Ride total ${formatNaira(total)}` : `Balance ${formatNaira(balance)}` },
    { id: "card", icon: "card", title: "Card", sub: "Pay with your debit card" },
    { id: "transfer", icon: "bank", title: "Bank transfer", sub: "Instant · virtual account" },
    { id: "cash", icon: "cash", title: "Cash to driver", sub: `${formatNaira(CASH_HOLD)} held from your wallet now`, car: true },
  ];

  const pay = () => {
    if (needsId) return idDlg.open();
    setFailure(null);
    setBusy(true);
    window.setTimeout(async () => {
      const r = kind === "car" ? await confirmCar() : confirmBus();
      if (r.ok) return router.push(`/app/booking/${r.id}`);
      setBusy(false);
      if (r.code === "ID_REQUIRED") return idDlg.open();
      setFailure(r);
    }, LIVE ? 0 : 700);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Review and reserve" back={trip ? `/app/trip/${trip.id}?from=${draft.pickupId}&to=${draft.dropoffId}&day=${draft.day}` : `/app/bus/${line!.id}`} />
      <div className="grid gap-5">
        <Card className="space-y-1">
          <p className="font-bold">{trip ? `${pickup?.name} → ${dropoff?.name}` : `Line ${line!.id} · ${line!.from} → ${line!.to}`}</p>
          <p className="text-sm text-fg-muted">{trip ? `${draft.day === 0 ? "Today" : draft.day === 1 ? "Tomorrow" : "Later"} · ${formatTime(trip.depart)} departure · ${SEAT_LABEL[draft.seat]}${driver ? ` · ${driver.name.split(" ")[0]}` : ""}` : `Today ${formatTime(draft.busTime ?? "")} · Seat ${draft.busSeats.join(", ")}`}</p>
        </Card>

        <fieldset className="space-y-2.5">
          <legend className="mb-2.5"><Eyebrow>Pay with</Eyebrow></legend>
          {methods.filter((m) => (!m.car || kind === "car") && (!LIVE || m.id === "wallet" || m.id === "cash")).map((m) => (
            <div key={m.id} className="relative">
              <RadioCard name="payment" checked={method === m.id} onSelect={() => { setDraft({ payment: m.id }); setFailure(null); }} icon={m.icon} title={m.title} sub={m.sub} />
              {m.id === "wallet" && walletShort > 0 && (
                <Link href={topUpHref(walletShort)} className="relative z-10 mt-2 flex min-h-11 items-center justify-center rounded-lg border-2 border-outline bg-primary px-4 font-bold text-primary-fg">Top up {formatNaira(walletShort)}</Link>
              )}
            </div>
          ))}
        </fieldset>

        {trip && <Card className="space-y-1"><PolicyNote departAt={trip.depart} /></Card>}
        {!trip && <p className="text-sm text-fg-secondary">{COPY.cancellation}</p>}

        {failure?.code === "INSUFFICIENT_FUNDS" && (
          <Banner tone="danger" icon="alert"><p>{failure.message}</p><Link href={topUpHref(failure.shortBy ?? 0)} className="mt-1 inline-block min-h-11 font-extrabold underline underline-offset-4">Top up {formatNaira(failure.shortBy ?? 0)}</Link></Banner>
        )}
        {failure?.code === "SEAT_TAKEN" && (
          <Banner tone="danger" icon="alert"><p>{failure.message}</p><Link href={trip ? `/app/trip/${trip.id}?from=${draft.pickupId}&to=${draft.dropoffId}&day=${draft.day}` : "/app/bus"} className="mt-1 inline-block min-h-11 font-extrabold underline underline-offset-4">Choose another seat</Link></Banner>
        )}
        {failure && failure.code !== "INSUFFICIENT_FUNDS" && failure.code !== "SEAT_TAKEN" && <Banner tone="danger" icon="alert">{failure.message}</Banner>}
        {busUnavailable && <Banner tone="warning" icon="alert">Bus tickets aren’t connected to the server yet. Car rides are.</Banner>}
        {DEMO && <p className="text-center text-sm text-fg-muted">{LIVE ? "Demo: wallet top-ups are simulated." : "Demo: payments are simulated."}</p>}
      </div>

      <div className="h-36" aria-hidden="true" />
      <StickyCta summary={<p className="flex items-baseline justify-between text-sm"><span className="font-semibold text-fg-secondary">{method === "cash" ? "Held now · rest paid to driver" : "Total · all-in"}</span><span className="font-display text-3xl font-extrabold tracking-[-0.03em]">{formatNaira(dueNow)}</span></p>}>
        <Button size="lg" full icon="lock" onClick={pay} disabled={busy || blocked} aria-busy={busy}>
          {busy ? "Reserving…" : blocked ? `Wallet is ${formatNaira(method === "cash" ? CASH_HOLD - balance : walletShort)} short` : method === "cash" ? `Reserve seat · ${formatNaira(dueNow)} hold` : `Reserve seat · ${formatNaira(dueNow)}`}
        </Button>
      </StickyCta>
      <VerifyIdSheet dialogRef={idDlg.ref} onVerified={pay} />
    </div>
  );
}
