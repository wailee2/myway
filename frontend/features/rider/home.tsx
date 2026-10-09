"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Badge, Card, Eyebrow } from "@/components/ui/primitives";
import { startFlow, track } from "@/lib/analytics";
import { BUS_LINES } from "@/lib/data/bus";
import { stopName } from "@/lib/data/stops";
import { describeDays, formatNaira, formatTime, greeting } from "@/lib/format";
import { useBooking } from "@/lib/store/booking";
import { useRider } from "@/lib/store/rider";
import { useSession } from "@/lib/store/session";
import { RoutePicker } from "./route-picker";

type Mode = "ride" | "bus";

export function RiderHome() {
  const router = useRouter();
  const name = useSession((s) => s.name);
  const balance = useBooking((s) => s.balance);
  const usual = useRider((s) => s.usualRoutes);
  const [mode, setMode] = useState<Mode>("ride");
  const [route, setRoute] = useState({ from: "", to: "" });
  const [tried, setTried] = useState(false);
  useEffect(() => { startFlow(); }, []);

  const today = (new Date().getDay() + 6) % 7; // 0 = Monday
  const ready = Boolean(route.from && route.to);
  const find = () => {
    if (!ready) return setTried(true);
    track("find_ride_tapped");
    router.push(`/app/search?from=${route.from}&to=${route.to}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section aria-labelledby="home-title" className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>{greeting()}{name ? `, ${name.split(" ")[0]}` : ""}</Eyebrow>
          <Link href="/app/wallet" className="pressable inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-sm font-bold" aria-label={`Wallet balance ${formatNaira(balance)}`}><Icon name="wallet" size={16} />{formatNaira(balance)}</Link>
        </div>
        <h1 id="home-title" className="text-display-lg">Find someone going your way.</h1>
      </section>

      <Segmented label="Travel type" value={mode} onChange={setMode} options={[{ value: "ride", label: "Shared ride", icon: "car" }, { value: "bus", label: "Scheduled bus", icon: "bus" }]} />

      {mode === "ride" ? (
        <>
          <form onSubmit={(e) => { e.preventDefault(); find(); }} className="space-y-4">
            <RoutePicker from={route.from} to={route.to} onChange={(r) => { setRoute(r); setTried(false); }} />
            {tried && !ready && <p role="alert" className="text-sm font-semibold text-danger-text">Choose where you’re starting and where you’re going.</p>}
            <Button type="submit" size="lg" full iconRight="arrowR">Find a ride</Button>
          </form>

          {usual.length > 0 && (
            <section aria-labelledby="usual-title" className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 id="usual-title" className="font-sans text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">{usual.length > 1 ? "Your usual routes" : "Your usual route"}</h2>
                <Link href="/app/usual" className="inline-flex min-h-11 items-center text-sm font-extrabold underline underline-offset-4">Manage</Link>
              </div>
              <ul className="grid gap-2.5">
                {usual.slice(0, 2).map((u) => (
                  <li key={u.id}>
                    <Card className="flex items-center gap-3.5 border-2 border-line">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-lg font-extrabold">{stopName(u.fromId).replace(" stop", "")} → {stopName(u.toId)}</p>
                        <p className="flex flex-wrap items-center gap-2 text-sm text-fg-secondary">{describeDays(u.days)} · around {formatTime(u.time)}{u.days.includes(today) && <Badge tone="primary">Today</Badge>}</p>
                      </div>
                      <Link href={`/app/search?from=${u.fromId}&to=${u.toId}`} className="pressable inline-flex h-12 shrink-0 items-center rounded-lg bg-secondary px-4 text-sm font-bold text-secondary-fg">Find my ride</Link>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <section className="space-y-3" aria-labelledby="bus-title">
          <h2 id="bus-title" className="font-sans text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Bus lines</h2>
          <ul className="grid gap-2.5">
            {BUS_LINES.map((l) => (
              <li key={l.id}>
                <Link href={`/app/bus/${l.id}`} className="pressable flex min-h-16 items-center gap-3 rounded-xl border-2 border-line bg-surface p-3.5 transition-colors hover:border-line-strong">
                  <span className="grid size-12 shrink-0 place-items-center rounded-[0.8rem] bg-secondary font-display text-lg font-extrabold text-primary">{l.id}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-bold">{l.from} → {l.to}</span><span className="block text-sm text-fg-muted">{l.headway} · {l.duration}</span></span>
                  <span className="font-display text-lg font-extrabold">{formatNaira(l.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/app/passes" className="pressable flex min-h-14 items-center gap-3 rounded-xl border-2 border-line bg-primary-soft p-4 font-bold"><Icon name="gift" size={22} /><span className="flex-1">Commuter passes</span><Icon name="arrowR" size={18} /></Link>
        </section>
      )}
    </div>
  );
}
