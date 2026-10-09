"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Field, Switch } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/primitives";
import { DEMO } from "@/lib/demo";
import { routeSpan, stopName } from "@/lib/data/stops";
import { formatNaira, formatTime } from "@/lib/format";
import { POLICY } from "@/lib/policy";
import { driverShare, fareGuide } from "@/lib/pricing";
import { useAlerts } from "@/lib/store/alerts";
import { useDriver } from "@/lib/store/driver";
import { RoutePicker } from "@/features/rider/route-picker";

export function PostTrip() {
  const router = useRouter();
  const publish = useDriver((s) => s.publish);
  const push = useAlerts((s) => s.push);
  const [route, setRoute] = useState({ from: "nyanya", to: "cbd" });
  const [time, setTime] = useState("07:10");
  const [seats, setSeats] = useState(4);
  const [price, setPrice] = useState(1350);
  const [women, setWomen] = useState(false);
  const [repeat, setRepeat] = useState(false); // never recurring unless the driver turns it on
  const [err, setErr] = useState("");

  const span = route.from && route.to ? routeSpan(route.from, route.to) : null;
  const guide = span ? fareGuide(span.km, span.minutes) : null;

  const submit = () => {
    if (!route.from || !route.to) return setErr("Choose where you start and where you finish.");
    if (price < 500 || price > 5000) return setErr("Set a price between ₦500 and ₦5,000 per seat.");
    publish({ fromId: route.from, toId: route.to, time, seats, price, womenOnly: women, repeatWeekdays: repeat });
    push("driver", { icon: "car", title: `Trip posted for ${formatTime(time)}`, body: `${stopName(route.from)} → ${stopName(route.to)} · ${seats} seats at ${formatNaira(price)}.` });
    router.push("/drive/live");
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader title="Post a trip" back="/drive" />
      <RoutePicker from={route.from} to={route.to} onChange={(r) => { setRoute(r); setErr(""); }} />
      <Field label="Leaves at" type="time" icon="clock" value={time} onChange={(e) => setTime(e.target.value)} />
      <Card className="flex items-center justify-between gap-4">
        <div><p className="font-bold">Seats to sell</p><p className="text-sm text-fg-muted">Four passengers maximum</p></div>
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Fewer seats" disabled={seats <= 1} onClick={() => setSeats((s) => s - 1)} className="pressable grid size-12 place-items-center rounded-full bg-surface-sunken disabled:text-fg-disabled"><Icon name="minus" size={18} /></button>
          <output aria-live="polite" className="w-6 text-center font-display text-3xl font-extrabold">{seats}</output>
          <button type="button" aria-label="More seats" disabled={seats >= 4} onClick={() => setSeats((s) => s + 1)} className="pressable grid size-12 place-items-center rounded-full bg-primary text-primary-fg disabled:bg-surface-sunken disabled:text-fg-disabled"><Icon name="plus" size={18} /></button>
        </div>
      </Card>
      <Card className="space-y-3">
        <Field label="Price per seat (₦), all-in" inputMode="numeric" icon="cash" value={String(price)} onChange={(e) => { setPrice(Number(e.target.value.replace(/\D/g, "")) || 0); setErr(""); }} error={err} />
        {guide && <p className="flex items-center gap-2 rounded-lg bg-surface-sunken p-3 text-sm text-fg-secondary"><Icon name="fuel" size={16} className="shrink-0 text-primary" />Fare guide for this route: {formatNaira(guide.low)}–{formatNaira(guide.high)} per seat, from distance and time{guide.sample && " (sample rates in demo)"}.</p>}
      </Card>
      <Card className="space-y-4">
        {([["Women-only trip", "Only women riders can book", women, setWomen], ["Repeat on weekdays", "Off unless you turn it on. We never create repeat trips silently.", repeat, setRepeat]] as const).map(([t, s, v, set]) => (
          <div key={t} className="flex items-center justify-between gap-4"><div><p className="font-bold">{t}</p><p className="text-sm text-fg-muted">{s}</p></div><Switch checked={v} onChange={set} label={t} /></div>
        ))}
      </Card>
      <p className="text-sm text-fg-secondary">You earn {formatNaira(driverShare(price) * seats)} if all {seats} seats fill, after MYWAY’s {Math.round(POLICY.commissionRate * 100)}% commission.{DEMO ? "" : ""}</p>
      <Button size="lg" full onClick={submit}>Publish trip</Button>
    </div>
  );
}
