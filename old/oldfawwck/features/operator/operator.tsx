"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Avatar, Badge, Banner, Card, Progress, Row } from "@/components/ui/primitives";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/cn";

export function OperatorDashboard() {
  const trips = [{ id: "N1", route: "Nyanya → CBD", time: "7:30", sold: 16 }, { id: "K2", route: "Kubwa → Wuse II", time: "7:45", sold: 9 }, { id: "L3", route: "Lugbe → Garki", time: "8:00", sold: 4 }];
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Cityline Coaches" sub="Operator console" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[["214", "Seats sold today", true], [formatNaira(149800), "Revenue", false], ["9 / 12", "Buses out", false]].map(([v, l, p]) => <Card key={l as string} tone={p ? "primary" : "default"}><p className="font-display text-4xl font-extrabold tracking-[-0.03em]">{v}</p><p className="text-sm font-semibold opacity-80">{l}</p></Card>)}
      </div>
      <section aria-labelledby="today" className="space-y-3"><h2 id="today" className="font-sans text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Today’s trips</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {trips.map((t) => (
            <li key={t.id}><Card className="space-y-3"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-[0.8rem] bg-secondary font-display font-extrabold text-primary">{t.id}</span><div className="flex-1"><p className="font-bold">{t.route}</p><p className="text-sm text-fg-muted">{t.sold} of 18 seats sold</p></div><p className="font-display text-2xl font-extrabold">{t.time}</p></div><Progress value={(t.sold / 18) * 100} tone={t.sold / 18 > 0.7 ? "success" : "primary"} label={`${t.route} seats sold`} /></Card></li>
          ))}
        </ul>
      </section>
      <Button icon="plus" size="lg">Add trip</Button>
    </div>
  );
}

const PASSENGERS = [["1B", "Wailee K.", true], ["2A", "Ibrahim S.", true], ["2C", "Ngozi O.", true], ["4B", "Tunde A.", false], ["5D", "Amina Y.", false], ["6A", "Emeka C.", false]] as const;

export function Manifest() {
  const [boarded, setBoarded] = useState<string[]>(PASSENGERS.filter((p) => p[2]).map((p) => p[0]));
  const count = boarded.length + 11;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="N1 · 7:30 · Bay 3" sub="Manifest" />
      <Card tone="primary" className="space-y-3"><div className="flex items-center justify-between"><p className="font-bold">Boarded</p><p className="font-display text-4xl font-extrabold">{count} / 18</p></div><Progress value={(count / 18) * 100} label="Passengers boarded" /></Card>
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
  const [valid, setValid] = useState<null | "ok" | "bad">(null);
  const [code, setCode] = useState("");
  const check = () => setValid(/^N1-\d[A-D]$/i.test(code.trim()) ? "ok" : "bad");
  return (
    <div className="mx-auto max-w-md space-y-5">
      <PageHeader title="Scan ticket" sub="Bus N1 · 7:30" />
      <div className="relative grid aspect-square place-items-center overflow-hidden rounded-2xl bg-secondary text-secondary-fg" role="img" aria-label="Camera viewfinder">
        <svg viewBox="0 0 260 260" fill="none" className="w-3/4" aria-hidden="true"><path d="M6 60V26a20 20 0 0120-20h34M200 6h34a20 20 0 0120 20v34M254 200v34a20 20 0 01-20 20h-34M60 254H26a20 20 0 01-20-20v-34" stroke="#FFC61A" strokeWidth="8" strokeLinecap="round" /></svg>
        <Icon name="scan" size={36} className="absolute text-primary opacity-60" />
      </div>
      <p className="text-center text-sm font-semibold text-fg-muted">Point the camera at the rider’s QR, or enter the code below.</p>
      <div className="flex gap-2.5"><input aria-label="Ticket code" value={code} onChange={(e) => { setCode(e.target.value); setValid(null); }} placeholder="e.g. N1-4B" className="h-14 min-w-0 flex-1 rounded-lg border-2 border-line bg-surface-sunken px-4 font-bold uppercase outline-none focus:border-line-strong" /><Button size="lg" onClick={check} disabled={!code}>Check</Button></div>
      {valid === "ok" && <Banner tone="success" icon="check"><span className="font-display text-lg font-extrabold">Valid · Seat {code.slice(3).toUpperCase()}</span><br />Tunde A. · N1 7:30 · Paid</Banner>}
      {valid === "bad" && <Banner tone="danger" icon="alert">That ticket isn’t valid for this trip. Check the code or ask the rider to open their ticket.</Banner>}
      <Row icon="users" title="Passenger list" sub="See who has boarded" right={<Avatar name="Cityline" size={32} tone="ink" />} />
    </div>
  );
}
