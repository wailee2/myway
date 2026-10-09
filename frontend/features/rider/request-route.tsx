"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { Banner, Progress } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { DEMO } from "@/lib/demo";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function RequestRoute({ initialFrom = "", initialTo = "" }: { initialFrom?: string; initialTo?: string }) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [time, setTime] = useState("7:00 am");
  const [days, setDays] = useState([0, 1, 2, 3, 4]);
  const [sent, setSent] = useState(false);
  const riders = sent ? 38 : 37; // DEMO sample count
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader title="Request a route" back="/app" />
      <p className="text-fg-muted">Can’t find your line? Tell us where you travel. When enough riders join, we launch it.</p>
      <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
        <Field label="From" icon="pin" value={from} onChange={(e) => setFrom(e.target.value)} required />
        <Field label="To" icon="flag" value={to} onChange={(e) => setTo(e.target.value)} required />
        <Field label="Preferred time" icon="clock" value={time} onChange={(e) => setTime(e.target.value)} />
        <div role="group" aria-label="Days of the week" className="flex gap-2">
          {DAYS.map((d, i) => { const on = days.includes(i); return <button key={i} type="button" aria-pressed={on} aria-label={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][i]} onClick={() => setDays((v) => on ? v.filter((x) => x !== i) : [...v, i])} className={cn("pressable size-11 rounded-full font-bold", on ? "bg-secondary text-primary" : "bg-surface-sunken text-fg-muted")}>{d}</button>; })}
        </div>
        {DEMO ? <div className="space-y-2.5 rounded-xl border-2 border-outline bg-primary-soft p-4">
          <p className="flex justify-between font-bold"><span>{riders} of 50 riders</span><span className="text-fg-muted">{50 - riders} to go</span></p>
          <Progress value={(riders / 50) * 100} label="Riders needed to launch this route" />
          <p className="text-sm text-fg-secondary">Sample data. The route launches when enough riders join. You won’t be charged.</p>
        </div> : <p className="rounded-lg bg-surface-sunken p-3 text-sm text-fg-secondary">We’ll tell you if enough riders ask for this route. You won’t be charged.</p>}
        {sent ? <Banner tone="success" icon="check">You’re in. We’ll notify you as soon as this route goes live.</Banner> : null}
        {sent ? <ButtonLink href="/app" size="lg" full>Back to home</ButtonLink> : <Button type="submit" size="lg" full icon="route">Request this route</Button>}
      </form>
    </div>
  );
}
