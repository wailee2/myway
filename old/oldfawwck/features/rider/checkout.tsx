"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { RadioCard } from "@/components/ui/form";
import { Banner, Card, EmptyState, Eyebrow } from "@/components/ui/primitives";
import { getLine } from "@/lib/data/bus";
import { stopName } from "@/lib/data/stops";
import { getTrip } from "@/lib/data/trips";
import { formatNaira } from "@/lib/format";
import { busQuote, CASH_HOLD, quote, SEAT_LABEL } from "@/lib/pricing";
import { useBooking } from "@/lib/store/booking";
import type { PaymentMethod } from "@/lib/types";

export function Checkout({ kind }: { kind: "car" | "bus" }) {
  const router = useRouter();
  const { draft, balance, setDraft, confirmCar, confirmBus } = useBooking();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const trip = kind === "car" && draft.tripId ? getTrip(draft.tripId) : undefined;
  const line = kind === "bus" && draft.lineId ? getLine(draft.lineId) : undefined;
  if ((kind === "car" && !trip) || (kind === "bus" && (!line || draft.busSeats.length === 0))) {
    return <EmptyState title="Nothing to pay for yet" body="Pick a trip and a seat first, then come back to check out." action={<ButtonLink href={kind === "car" ? "/app" : "/app/bus"} icon="search">{kind === "car" ? "Find a car" : "See bus lines"}</ButtonLink>} />;
  }

  const q = trip ? quote(trip.price, draft.seat) : busQuote(line!.price, draft.busSeats.length);
  const method = draft.payment;
  const dueNow = method === "cash" ? CASH_HOLD : q.total;
  const methods: { id: PaymentMethod; icon: "wallet" | "bank" | "card" | "cash"; title: string; sub: string; car?: boolean }[] = [
    { id: "wallet", icon: "wallet", title: "MYWAY wallet", sub: `Balance ${formatNaira(balance)}` },
    { id: "transfer", icon: "bank", title: "Bank transfer", sub: "Instant · virtual account" },
    { id: "card", icon: "card", title: "Card", sub: "Visa •• 4242" },
    { id: "cash", icon: "cash", title: "Cash to driver", sub: `${formatNaira(CASH_HOLD)} booking hold now`, car: true },
  ];

  const pay = () => {
    setError("");
    setBusy(true);
    window.setTimeout(() => {
      const r = kind === "car" ? confirmCar() : confirmBus();
      if (r.ok) router.push(`/app/booking/${r.id}`);
      else { setError(r.reason); setBusy(false); }
    }, 700);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Checkout" back={trip ? `/app/trip/${trip.id}` : `/app/bus/${line!.id}`} />
      <div className="grid gap-5">
        <Card className="space-y-1">
          <p className="font-bold">{trip ? `${stopName(trip.fromId)} → ${stopName(trip.toId)}` : `Line ${line!.id} · ${line!.from} → ${line!.to}`}</p>
          <p className="text-sm text-fg-muted">{trip ? `Today ${trip.depart} · ${SEAT_LABEL[draft.seat]}` : `Today ${draft.busTime} · Seat ${draft.busSeats.join(", ")}`}</p>
        </Card>
        <fieldset className="space-y-2.5">
          <legend className="mb-2.5"><Eyebrow>Pay with</Eyebrow></legend>
          {methods.filter((m) => !m.car || kind === "car").map((m) => (
            <div key={m.id} className="relative">
              <RadioCard name="payment" checked={method === m.id} onSelect={() => setDraft({ payment: m.id })} icon={m.icon} title={m.title} sub={m.sub} />
            </div>
          ))}
        </fieldset>
        <Card className="space-y-2.5">
          {[["Fare", q.fare], ...(q.fee ? [["Booking fee", q.fee]] : []), ...(q.fuel ? [["Fuel adjustment", q.fuel]] : [])].map(([l, v]) => (
            <div key={l as string} className="flex justify-between text-fg-secondary"><span>{l}</span><span className="font-semibold text-fg">{formatNaira(v as number)}</span></div>
          ))}
          <div className="flex items-end justify-between border-t border-line pt-3"><span className="font-bold">Total</span><span className="font-display text-3xl font-extrabold tracking-[-0.03em]">{formatNaira(q.total)}</span></div>
        </Card>
        {error && (
          <Banner tone="danger" icon="alert">
            {error} {error.includes("short") || error.includes("low") ? <Link href="/app/wallet/top-up" className="underline">Top up your wallet</Link> : null}
          </Banner>
        )}
        <Button size="lg" full icon="lock" variant="secondary" onClick={pay} disabled={busy} aria-busy={busy}>{busy ? "Confirming…" : method === "cash" ? `Reserve · ${formatNaira(dueNow)} hold` : `Pay ${formatNaira(dueNow)}`}</Button>
        <p className="text-center text-sm text-fg-muted">Free cancellation until 30 minutes before pickup. Payment is simulated in this demo.</p>
      </div>
    </div>
  );
}
