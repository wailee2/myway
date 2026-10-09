"use client";

import { useEffect, useState } from "react";
import { DEMO, DEMO_MANIFEST } from "@/lib/demo";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Avatar, Badge, Banner, Card, Progress, Row } from "@/components/ui/primitives";
import { formatNaira } from "@/lib/format";
import { useOperator } from "@/lib/store/operator";
import { useSession } from "@/lib/store/session";
import { cn } from "@/lib/cn";

export function OperatorDashboard() {
  const { trips, buses } = useOperator();
  const name = useSession((st) => st.name);
  const sold = trips.reduce((a, t) => a + t.sold, 0);
  const revenue = trips.reduce((a, t) => a + t.sold * t.fare, 0);
  const out = buses.filter((b) => b.status === "on-route").length;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={name || "Operator console"} sub="Operator console" />
      <div className="grid grid-cols-2 gap-3">
        {[[String(sold), "Seats sold today", true], [formatNaira(revenue), "Revenue", false], [`${out} / ${buses.length}`, "Buses out", false]].map(([v, l, p], i) => <Card key={l as string} tone={p ? "primary" : "default"} className={cn(i === 0 && "col-span-2")}><p className="font-display text-3xl font-extrabold tracking-[-0.03em]">{v}</p><p className="text-sm font-semibold opacity-80">{l}</p></Card>)}
      </div>
      <section aria-labelledby="today" className="space-y-3"><h2 id="today" className="font-sans text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Today’s trips</h2>
        <ul className="grid gap-3">
          {trips.map((t) => (
            <li key={t.id}><Card className="space-y-3"><div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-[0.8rem] bg-secondary font-display font-extrabold text-primary">{t.line}</span><div className="min-w-0 flex-1"><p className="font-bold leading-snug">{t.route}</p><p className="text-sm text-fg-muted">{t.sold} of {t.seats} seats sold</p></div><p className="shrink-0 font-display text-xl font-extrabold">{t.time}</p></div><Progress value={(t.sold / t.seats) * 100} tone={t.sold / t.seats > 0.7 ? "success" : "primary"} label={`${t.route} seats sold`} /></Card></li>
          ))}
        </ul>
      </section>
      <ButtonLink href="/operator/trips/new" icon="plus" size="lg" full>Add trip</ButtonLink>
    </div>
  );
}

const PASSENGERS = DEMO ? DEMO_MANIFEST : [];

export function Manifest() {
  const [boarded, setBoarded] = useState<string[]>(PASSENGERS.filter((p) => p[2]).map((p) => p[0]));
  const count = boarded.length;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="N1 · 7:30 · Bay 3" sub="Manifest" />
      <Card tone="primary" className="space-y-3"><div className="flex items-center justify-between"><p className="font-bold">Boarded</p><p className="font-display text-4xl font-extrabold">{count} / {PASSENGERS.length}</p></div><Progress value={PASSENGERS.length ? (count / PASSENGERS.length) * 100 : 0} label="Passengers boarded" /></Card>
      <ul className="divide-y divide-line rounded-xl border border-line bg-surface px-4">
        {PASSENGERS.map(([seat, name]) => {
          const on = boarded.includes(seat);
          return (
            <li key={seat} className="flex items-center gap-3.5 py-3">
              <span className={cn("grid size-10 place-items-center rounded-[0.7rem] border-2 border-outline text-xs font-extrabold", on ? "bg-primary text-primary-fg" : "bg-surface")}>{seat}</span>
              <span className="flex-1 font-bold">{name}</span>
              <button type="button" onClick={() => setBoarded((b) => (on ? b.filter((x) => x !== seat) : [...b, seat]))} aria-pressed={on} className="pressable"><Badge tone={on ? "success" : "neutral"} icon={on ? "check" : undefined}>{on ? "Boarded" : "Waiting"}</Badge></button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ScanTicket() {
  const [result, setResult] = useState<null | { ok: boolean; seat: string; name?: string }>(null);
  const [code, setCode] = useState("");
  const check = () => {
    const m = /^N1-(\d[A-D])$/i.exec(code.trim());
    const seat = m?.[1]?.toUpperCase();
    const p = PASSENGERS.find((x) => x[0] === seat);
    setResult({ ok: Boolean(p), seat: seat ?? code.trim().toUpperCase(), name: p?.[1] });
    setCode("");
  };
  // Instant full-screen green/red feedback that clears itself, so the marshal can scan the next ticket.
  useEffect(() => {
    if (!result) return;
    const id = window.setTimeout(() => setResult(null), 1400);
    return () => window.clearTimeout(id);
  }, [result]);
  return (
    <div className="mx-auto max-w-md space-y-5">
      <PageHeader title="Scan ticket" sub="Bus N1 · 7:30 AM" />
      <div className="relative grid aspect-square place-items-center overflow-hidden rounded-2xl bg-secondary text-secondary-fg" role="img" aria-label="Camera viewfinder">
        <svg viewBox="0 0 260 260" fill="none" className="w-3/4" aria-hidden="true"><path d="M6 60V26a20 20 0 0120-20h34M200 6h34a20 20 0 0120 20v34M254 200v34a20 20 0 01-20 20h-34M60 254H26a20 20 0 01-20-20v-34M4 12" stroke="#FFC61A" strokeWidth="8" strokeLinecap="round" /></svg>
        <Icon name="scan" size={36} className="absolute text-primary opacity-60" />
      </div>
      <p className="text-center text-sm font-semibold text-fg-muted">Point the camera at the rider’s QR, or enter the code below.</p>
      <form className="flex gap-2.5" onSubmit={(e) => { e.preventDefault(); if (code) check(); }}><input aria-label="Ticket code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. N1-4B" className="h-14 min-w-0 flex-1 rounded-lg border-2 border-line bg-surface-sunken px-4 font-bold uppercase outline-none focus:border-line-strong" /><Button type="submit" size="lg" disabled={!code}>Check</Button></form>
      <Row icon="users" title="Passenger list" sub="See who has boarded" right={<Avatar name="Cityline" size={32} tone="ink" />} />
      {result && (
        <div role="alert" className={cn("fixed inset-0 z-[70] grid place-items-center p-8 text-center text-white", result.ok ? "bg-[#0a7a43]" : "bg-danger-solid")}>
          <div className="grid gap-3">
            <Icon name={result.ok ? "check" : "x"} size={96} strokeWidth={3} className="mx-auto" />
            <p className="font-display text-5xl font-extrabold">{result.ok ? "Valid" : "Not valid"}</p>
            <p className="text-xl font-bold">{result.ok ? `Seat ${result.seat} · ${result.name}` : "This ticket isn’t on this trip. Ask the rider to open their ticket."}</p>
          </div>
        </div>
      )}
    </div>
  );
}
