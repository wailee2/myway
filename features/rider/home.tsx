"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapCanvas } from "@/components/map/map-canvas";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Badge, Eyebrow, Row } from "@/components/ui/primitives";
import { BUS_LINES } from "@/lib/data/bus";
import { useSession } from "@/lib/store/session";
import { formatNaira } from "@/lib/format";
import { RoutePicker } from "./route-picker";

type Mode = "car" | "bus";

export function RiderHome() {
  const router = useRouter();
  const name = useSession((s) => s.name);
  const [mode, setMode] = useState<Mode>("car");
  const [route, setRoute] = useState({ from: "nyanya", to: "cbd" });
  const markers = mode === "car"
    ? [{ x: 70, y: 150, kind: "car" as const }, { x: 250, y: 250, kind: "car" as const }, { x: 300, y: 390, kind: "car" as const }, { x: 190, y: 330, kind: "me" as const }]
    : [{ x: 80, y: 170, kind: "bus" as const }, { x: 260, y: 240, kind: "bus" as const }, { x: 190, y: 330, kind: "me" as const }];

  return (
    <div className="grid gap-5 lg:grid-cols-[26rem_1fr] lg:gap-8">
      <section aria-labelledby="home-title" className="order-2 space-y-5 lg:order-1">
        <div className="space-y-1">
          <Eyebrow>Good morning, {name}</Eyebrow>
          <h1 id="home-title" className="text-display-md">Where to today?</h1>
        </div>
        <Segmented label="Travel mode" value={mode} onChange={setMode} options={[{ value: "car", label: "Car", icon: "car" }, { value: "bus", label: "Bus", icon: "bus" }]} />

        {mode === "car" ? (
          <form onSubmit={(e) => { e.preventDefault(); router.push(`/app/search?from=${route.from}&to=${route.to}`); }} className="space-y-4">
            <RoutePicker from={route.from} to={route.to} onChange={setRoute} idPrefix="home" />
            <Button type="submit" size="lg" full iconRight="arrowR">See cars and buses</Button>
            <div>
              <h2 className="mb-1 font-sans text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Recent routes</h2>
              <ul>
                <li><Link href="/app/search?from=nyanya&to=cbd" className="block rounded-lg px-1 hover:bg-surface-sunken"><Row icon="history" title="Nyanya Bridge → CBD Terminal" sub="Leaves 7:10 · 2 seats left" right={<Icon name="chevR" size={18} className="text-fg-disabled" />} /></Link></li>
                <li><Link href="/app/search?from=kubwa&to=wuse2" className="block rounded-lg px-1 hover:bg-surface-sunken"><Row icon="history" title="Kubwa → Wuse II" sub="Leaves 7:30 · from ₦1,500" right={<Icon name="chevR" size={18} className="text-fg-disabled" />} /></Link></li>
              </ul>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <h2 className="font-sans text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Bus lines near you</h2>
            <ul className="grid gap-2.5">
              {BUS_LINES.map((l, i) => (
                <li key={l.id}>
                  <Link href={`/app/bus/${l.id}`} className={`pressable flex items-center gap-3 rounded-xl border-2 p-3.5 transition-colors ${i === 0 ? "border-outline bg-primary-soft shadow-hard" : "border-line bg-surface hover:border-line-strong"}`}>
                    <span className="grid size-12 shrink-0 place-items-center rounded-[0.8rem] bg-secondary font-display text-lg font-extrabold text-primary">{l.id}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate font-bold">{l.from} ⇄ {l.to}</span><span className="block text-sm text-fg-muted">Next in {6 + i * 6} min · {l.headway}</span></span>
                    <span className="font-display text-lg font-extrabold">{formatNaira(l.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link href="/app/passes" className="pressable sticker flex items-center gap-3 rounded-xl bg-primary p-4 text-primary-fg">
          <Icon name="gift" size={24} />
          <span className="flex-1 font-bold">Monthly commuter pass · save 15%</span>
          <Icon name="arrowR" size={18} />
        </Link>
      </section>

      <div className="relative order-1 h-60 overflow-hidden rounded-2xl border-2 border-outline lg:sticky lg:top-8 lg:order-2 lg:h-[calc(100dvh-7rem)] lg:min-h-[32rem]">
        <MapCanvas markers={markers} label={mode === "car" ? "Map showing nearby cars" : "Map showing nearby buses"} />
        <Badge tone="ink" icon={mode === "car" ? "car" : "bus"} className="absolute left-3 top-3 shadow-hard">{mode === "car" ? "3 cars near you" : "2 buses near you"}</Badge>
      </div>
    </div>
  );
}
