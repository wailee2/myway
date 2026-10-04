"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { Badge, Banner, Card, Chip } from "@/components/ui/primitives";
import { digitsOnly } from "@/lib/input";
import { useAlerts } from "@/lib/store/alerts";
import { useOperator, type BusStatus } from "@/lib/store/operator";

const LABEL: Record<BusStatus, string> = { "on-route": "On route", "at-bay": "At bay", maintenance: "Maintenance" };
const TONE: Record<BusStatus, "success" | "neutral" | "warning"> = { "on-route": "success", "at-bay": "neutral", maintenance: "warning" };

export function Fleet() {
  const { buses, addBus, setBusStatus } = useOperator();
  const push = useAlerts((s) => s.push);
  const [plate, setPlate] = useState("");
  const [seats, setSeats] = useState("18");
  const [err, setErr] = useState("");
  const [added, setAdded] = useState("");

  const add = () => {
    const p = plate.trim().toUpperCase();
    if (!/^[A-Z]{3}-?\d{2,3}-?[A-Z]{2}$/.test(p)) return setErr("Enter a plate like ABJ-114-XA.");
    const n = Number(seats);
    if (n < 8 || n > 60) return setErr("Seats must be between 8 and 60.");
    addBus({ plate: p, seats: n });
    push("operator", { icon: "bus", title: "Bus added to your fleet", body: `${p} · ${n} seats` });
    setAdded(p); setPlate(""); setErr("");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Fleet" back="/operator/profile" sub={`${buses.length} buses`} />
      <ul className="grid gap-3">
        {buses.map((b) => (
          <li key={b.id}>
            <Card className="space-y-3">
              <div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-[0.8rem] bg-secondary text-primary"><span className="font-display text-sm font-extrabold">{b.line}</span></span><div className="min-w-0 flex-1"><p className="font-bold">{b.plate}</p><p className="text-sm text-fg-muted">{b.seats} seats</p></div><Badge tone={TONE[b.status]}>{LABEL[b.status]}</Badge></div>
              <div className="flex flex-wrap gap-2" role="group" aria-label={`Status for ${b.plate}`}>{(Object.keys(LABEL) as BusStatus[]).map((s) => <Chip key={s} active={b.status === s} onClick={() => setBusStatus(b.id, s)}>{LABEL[s]}</Chip>)}</div>
            </Card>
          </li>
        ))}
      </ul>
      <section className="space-y-4 rounded-xl border border-line bg-surface p-4" aria-labelledby="add-bus">
        <h2 id="add-bus" className="font-display text-lg font-extrabold">Add a bus</h2>
        <Field label="Plate number" autoCapitalize="characters" maxLength={10} placeholder="ABJ-114-XA" icon="bus" value={plate} onChange={(e) => { setPlate(e.target.value.toUpperCase()); setErr(""); setAdded(""); }} error={err || undefined} />
        <Field label="Seats" inputMode="numeric" pattern="[0-9]*" maxLength={2} icon="users" value={seats} onChange={(e) => setSeats(digitsOnly(e.target.value, 2))} />
        {added && <Banner tone="success" icon="check">{added} was added to your fleet.</Banner>}
        <Button size="lg" full icon="plus" onClick={add}>Add bus</Button>
      </section>
    </div>
  );
}
