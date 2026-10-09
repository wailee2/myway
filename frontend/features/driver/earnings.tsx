"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, Row } from "@/components/ui/primitives";
import { stopName } from "@/lib/data/stops";
import { formatNaira } from "@/lib/format";
import { POLICY } from "@/lib/policy";
import { useDriver } from "@/lib/store/driver";
import { cn } from "@/lib/cn";

/** Everything here is computed from the driver's real trip history: no hard-coded totals. */
export function Earnings() {
  const { balance, history } = useDriver();
  const net = history.reduce((a, h) => a + h.earned, 0);
  const gross = Math.round(net / (1 - POLICY.commissionRate));
  const riders = history.reduce((a, h) => a + h.riders, 0);
  const recent = history.slice(0, 7).reverse();
  const max = Math.max(1, ...recent.map((h) => h.earned));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Earnings" />
      {history.length === 0 ? (
        <EmptyState title="No trips yet" body="Your earnings show here after your first completed trip." action={<ButtonLink href="/drive/post" icon="plus">Post a trip</ButtonLink>} />
      ) : (
        <>
          <section aria-label="Summary" className="space-y-1">
            <p className="text-sm font-semibold text-fg-muted">From your {history.length} trips</p>
            <p className="font-display text-6xl font-extrabold tracking-[-0.04em]">{formatNaira(net)}</p>
            <p className="text-sm font-semibold text-success-text">{riders} riders carried</p>
          </section>
          <div className="flex h-40 items-end justify-between gap-2.5" role="img" aria-label={`Earnings for your last ${recent.length} trips`}>
            {recent.map((h, i) => <div key={h.id} className="flex flex-1 flex-col items-center gap-2"><span className={cn("w-full rounded-xl", i === recent.length - 1 ? "bg-primary" : "bg-surface-sunken")} style={{ height: Math.max(8, (h.earned / max) * 120) }} /><span className="text-xs font-bold text-fg-muted">{h.when.split(" · ")[0]?.slice(0, 3)}</span></div>)}
          </div>
          <Card className="divide-y divide-line p-3">
            <Row icon="car" title="Fares" right={<span className="font-display text-lg font-extrabold">{formatNaira(gross)}</span>} />
            <Row icon="trend" title={`MYWAY commission · ${Math.round(POLICY.commissionRate * 100)}%`} right={<span className="font-display text-lg font-extrabold text-danger-text">-{formatNaira(gross - net)}</span>} />
            <Row icon="wallet" title="You earned" right={<span className="font-display text-lg font-extrabold text-success-text">{formatNaira(net)}</span>} />
          </Card>
        </>
      )}
      <Card tone="inverse" className="flex items-center justify-between gap-4 p-5"><div><p className="text-sm text-secondary-fg/70">Available to withdraw</p><p className="font-display text-3xl font-extrabold">{formatNaira(balance)}</p></div><ButtonLink href="/drive/withdraw" icon="bank">Withdraw</ButtonLink></Card>
      {history.length > 0 && <ul className="divide-y divide-line">{history.slice(0, 5).map((h) => <li key={h.id}><Row icon="car" title={`${stopName(h.fromId)} → ${stopName(h.toId)}`} sub={`${h.when} · ${h.riders} riders`} right={<span className="font-display text-lg font-extrabold text-success-text">+{formatNaira(h.earned)}</span>} /></li>)}</ul>}
    </div>
  );
}
