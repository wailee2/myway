"use client";

import Link from "next/link";
import { MapCanvas } from "@/components/map/map-canvas";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, Card, Eyebrow, Progress } from "@/components/ui/primitives";
import { formatNaira } from "@/lib/format";
import { useDriver } from "@/lib/store/driver";
import { useSession } from "@/lib/store/session";

export function DriverHome() {
  const { online, setOnline, activeTrip } = useDriver();
  const name = useSession((s) => s.name);
  return (
    <div className="grid gap-6 lg:grid-cols-[28rem_1fr] lg:gap-8">
      <section aria-labelledby="dh-title" className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div><Eyebrow>Good morning</Eyebrow><h1 id="dh-title" className="text-display-md">{name}</h1></div>
          <Badge tone={online ? "success" : "neutral"} icon={online ? "check" : undefined}>{online ? "Online" : "Offline"}</Badge>
        </div>
        {activeTrip ? (
          <Card tone="primary" className="space-y-3">
            <p className="text-caption font-extrabold uppercase tracking-[0.14em]">Your posted trip</p>
            <p className="font-display text-3xl font-extrabold">{activeTrip.time} · {activeTrip.seats} seats</p>
            <ButtonLink href="/drive/live" variant="secondary" full iconRight="arrowR">Open trip</ButtonLink>
          </Card>
        ) : (
          <Button size="lg" full icon="power" onClick={() => setOnline(!online)} variant={online ? "outline" : "primary"}>{online ? "Go offline" : "Go online"}</Button>
        )}
        <ButtonLink href="/drive/post" variant="outline" size="lg" full icon="plus">Post a trip</ButtonLink>
        <div className="grid grid-cols-3 gap-3">
          {[["₦14,600", "Today"], ["3", "Trips"], ["4.9", "Rating"]].map(([v, l]) => <Card key={l} className="p-3.5"><p className="font-display text-2xl font-extrabold">{v}</p><p className="text-sm text-fg-muted">{l}</p></Card>)}
        </div>
        <Card className="space-y-3">
          <div className="flex items-center justify-between"><p className="font-bold">Weekly bonus</p><p className="font-display text-2xl font-extrabold text-primary">{formatNaira(5000)}</p></div>
          <Progress value={65} label="Weekly bonus progress" />
          <p className="text-sm text-fg-muted">Complete 8 more trips to unlock it.</p>
        </Card>
        <Link href="/app" className="block text-center text-sm font-bold text-fg-muted underline">Switch to rider app</Link>
      </section>
      <div className="relative h-72 overflow-hidden rounded-2xl border-2 border-line lg:sticky lg:top-8 lg:h-[calc(100dvh-7rem)]">
        <MapCanvas route={null} markers={[{ x: 70, y: 150, kind: "demand", label: "8" }, { x: 210, y: 250, kind: "demand", label: "14" }, { x: 300, y: 190, kind: "demand", label: "5" }, { x: 190, y: 340, kind: "me" }]} label="Map of rider demand near your route" />
        <Badge tone="ink" icon="users" className="absolute left-3 top-3 shadow-hard">27 riders waiting near your route</Badge>
        <p className="sr-only">Demand hotspots: 8, 14 and 5 riders waiting.</p>
      </div>
    </div>
  );
}
