"use client";

import { ButtonLink } from "@/components/ui/button";
import { Switch } from "@/components/ui/form";
import { Badge, Card, Eyebrow } from "@/components/ui/primitives";
import { DEMO, DEMO_ROUTE_DEMAND } from "@/lib/demo";
import { stopName, routeSpan } from "@/lib/data/stops";
import { formatNaira, formatTime, greeting } from "@/lib/format";
import { useDemoRiders } from "@/lib/hooks/use-demo-riders";
import { driverShare } from "@/lib/pricing";
import { useDriver } from "@/lib/store/driver";
import { useSession } from "@/lib/store/session";

export function DriverHome() {
  const { online, setOnline, activeTrip, riders, history } = useDriver();
  const name = useSession((s) => s.name);
  useDemoRiders();

  const today = history.filter((h) => h.when.startsWith("Today"));
  const earnedToday = today.reduce((a, h) => a + h.earned, 0);
  const booked = riders.length;
  const demand = activeTrip ? DEMO_ROUTE_DEMAND[routeSpan(activeTrip.fromId, activeTrip.toId)?.routeId ?? ""] : DEMO_ROUTE_DEMAND["r-nyanya-cbd"];

  return (
    <section aria-labelledby="dh-title" className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div><Eyebrow>{greeting()}</Eyebrow><h1 id="dh-title" className="text-display-md">{name || "Driver"}</h1></div>
        <Badge tone={online ? "success" : "neutral"} icon={online ? "check" : undefined}>{online ? "Online" : "Offline"}</Badge>
      </div>

      {/* The driver's first question: "Do I have riders?" */}
      {activeTrip ? (
        <Card tone="primary" className="space-y-3">
          <p className="text-caption font-extrabold uppercase tracking-[0.14em]">Next trip</p>
          <p className="font-display text-2xl font-extrabold leading-tight">{stopName(activeTrip.fromId).replace(" stop", "")} → {stopName(activeTrip.toId)} · {formatTime(activeTrip.time)}</p>
          <p className="text-lg font-bold" aria-live="polite">{booked} / {activeTrip.seats} seats booked</p>
          <p className="font-semibold">Expected earnings {formatNaira(driverShare(activeTrip.price) * booked)}{booked < activeTrip.seats && ` · up to ${formatNaira(driverShare(activeTrip.price) * activeTrip.seats)} if full`}</p>
          <ButtonLink href="/drive/live" variant="secondary" full iconRight="arrowR">Open trip</ButtonLink>
        </Card>
      ) : (
        <Card className="space-y-3 border-2 border-line">
          <p className="font-display text-xl font-extrabold">No trip posted</p>
          <p className="text-fg-secondary">Post a trip you already make and riders going your way can book your seats.</p>
          <ButtonLink href="/drive/post" size="lg" full icon="plus">Post a trip</ButtonLink>
        </Card>
      )}

      {DEMO && demand ? (
        <Card className="space-y-1">
          <div className="flex items-center justify-between gap-2"><p className="font-bold">People going your way</p><Badge tone="warning">Sample data</Badge></div>
          <p className="text-fg-secondary">{activeTrip ? `${stopName(activeTrip.fromId).replace(" stop", "")} → ${stopName(activeTrip.toId)}` : "Nyanya → CBD"}: <span className="font-extrabold text-fg">{demand} looking</span></p>
        </Card>
      ) : null}

      {/* Going online is separate from posting a trip. */}
      <Card className="flex items-center justify-between gap-4">
        <div className="min-w-0"><p className="font-bold">{online ? "You’re online" : "Go online"}</p><p className="text-sm text-fg-muted">Lets riders see you’re available. It doesn’t post a trip.</p></div>
        <Switch checked={online} onChange={setOnline} label="Go online" />
      </Card>
      {activeTrip && <ButtonLink href="/drive/post" variant="outline" size="lg" full icon="plus">Post another trip</ButtonLink>}

      <div className="grid grid-cols-2 gap-3">
        {[[formatNaira(earnedToday), "Earned today"], [String(today.length), "Trips today"]].map(([v, l]) => <Card key={l} className="p-3.5"><p className="font-display text-2xl font-extrabold">{v}</p><p className="text-sm text-fg-muted">{l}</p></Card>)}
      </div>
    </section>
  );
}
