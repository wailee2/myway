"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { Banner, Card, Chip } from "@/components/ui/primitives";
import { formatNaira } from "@/lib/format";
import { useAlerts } from "@/lib/store/alerts";
import { LINES, useOperator } from "@/lib/store/operator";

export function AddTrip() {
  const router = useRouter();
  const { buses, addTrip } = useOperator();
  const push = useAlerts((s) => s.push);
  const free = buses.filter((b) => b.status !== "maintenance");
  const [line, setLine] = useState(LINES[0]!.id);
  const [time, setTime] = useState("08:30");
  const [busId, setBusId] = useState(free[0]?.id ?? "");
  const [err, setErr] = useState("");
  const l = LINES.find((x) => x.id === line)!;
  const bus = buses.find((b) => b.id === busId);

  const publish = () => {
    if (!busId) return setErr("Pick a bus. Buses in maintenance can’t be scheduled.");
    if (!time) return setErr("Choose a departure time.");
    addTrip({ line, time, busId });
    push("operator", { icon: "bus", title: `${line} trip added`, body: `${l.route} at ${time}. Riders can book it now.` });
    router.push("/operator");
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader title="Add trip" back="/operator" sub="Schedule a bus for today" />
      <div className="space-y-2.5"><p className="font-sans text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Line</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Line">{LINES.map((x) => <Chip key={x.id} active={line === x.id} onClick={() => setLine(x.id)}>{x.id} · {x.route}</Chip>)}</div></div>
      <Field label="Departs at" type="time" icon="clock" value={time} onChange={(e) => { setTime(e.target.value); setErr(""); }} />
      <div className="space-y-2.5"><p className="font-sans text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Bus</p>
        {free.length ? <div className="flex flex-wrap gap-2" role="group" aria-label="Bus">{free.map((b) => <Chip key={b.id} active={busId === b.id} onClick={() => { setBusId(b.id); setErr(""); }}>{b.plate} · {b.seats}</Chip>)}</div> : <Banner tone="danger" icon="alert">All your buses are in maintenance.</Banner>}</div>
      <Card className="flex items-center justify-between gap-4"><div><p className="font-bold">Fare per seat</p><p className="text-sm text-fg-muted">Set by the line</p></div><p className="font-display text-2xl font-extrabold">{formatNaira(l.fare)}</p></Card>
      {bus && <p className="text-sm text-fg-muted">If all {bus.seats} seats sell you earn {formatNaira(bus.seats * l.fare)}.</p>}
      {err && <Banner tone="danger" icon="alert">{err}</Banner>}
      <Button size="lg" full onClick={publish}>Publish trip</Button>
    </div>
  );
}
