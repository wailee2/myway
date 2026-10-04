"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/primitives";
import { STOPS } from "@/lib/data/stops";
import { findTrips } from "@/lib/data/trips";
import { formatNaira } from "@/lib/format";
import { FRONT_SEAT_PREMIUM } from "@/lib/pricing";
import { cn } from "@/lib/cn";

const FROM = ["nyanya", "kubwa", "lugbe", "gwagwalada"];
const TO = ["cbd", "wuse2", "garki"];
type Seat = "front" | "back-l" | "back-m" | "back-r";

const SELECT = "w-full appearance-none rounded-lg border-2 border-line bg-surface-sunken py-3 pl-11 pr-10 text-base font-bold text-fg outline-none transition-colors focus:border-line-strong";

/** Live demo of the core promise: pick a stop, pick a seat, see the real price. */
export function HeroWidget() {
  const router = useRouter();
  const [from, setFrom] = useState("nyanya");
  const [to, setTo] = useState("cbd");
  const [seat, setSeat] = useState<Seat>("back-m");
  const trips = findTrips(from, to);
  const base = trips[0]?.price ?? 1200;
  const price = seat === "front" ? base + FRONT_SEAT_PREMIUM : base;
  const seatBtn = (id: Seat, label: string) => (
    <button
      key={id}
      type="button"
      aria-pressed={seat === id}
      aria-label={label}
      onClick={() => setSeat(id)}
      className={cn("pressable grid h-14 flex-1 place-items-center rounded-[0.9rem] border-2 text-xs font-extrabold", seat === id ? "border-outline bg-primary text-primary-fg" : "border-line-strong bg-surface text-fg-muted hover:bg-surface-sunken")}
    >
      {seat === id ? <Icon name="check" size={20} strokeWidth={3.2} /> : ({ front: "Front", "back-l": "Left", "back-m": "Mid", "back-r": "Right" } as const)[id]}
    </button>
  );
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); router.push(`/app/search?from=${from}&to=${to}&seat=${seat}`); }}
      className="sticker-lg w-full max-w-md space-y-4 rounded-2xl bg-surface p-5 sm:p-6 lg:max-w-none"
      aria-label="Find a seat"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-extrabold">Find your seat</h2>
        <Badge tone="success" icon="check">{trips.length ? `${trips.length} cars today` : "Request a route"}</Badge>
      </div>
      <div className="space-y-2.5">
        {[{ label: "From", id: "hw-from", value: from, set: setFrom, ids: FROM, icon: "pin" as const }, { label: "To", id: "hw-to", value: to, set: setTo, ids: TO, icon: "flag" as const }].map((f) => (
          <div key={f.id} className="relative">
            <label htmlFor={f.id} className="sr-only">{f.label}</label>
            <Icon name={f.icon} size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted" />
            <select id={f.id} value={f.value} onChange={(e) => f.set(e.target.value)} className={SELECT}>
              {STOPS.filter((s) => f.ids.includes(s.id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <Icon name="chevD" size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-muted" />
          </div>
        ))}
      </div>
      <div>
        <p className="mb-2 text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Choose a seat · max four per car</p>
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="grid h-14 w-12 place-items-center rounded-[0.9rem] bg-secondary text-primary"><Icon name="car" size={20} /></span>
          {seatBtn("front", "Front seat")}
          <span className="w-2" />
          {seatBtn("back-l", "Back left")}
          {seatBtn("back-m", "Back middle")}
          {seatBtn("back-r", "Back right")}
        </div>
      </div>
      <Button type="submit" size="lg" full iconRight="arrowR">Find seats · {formatNaira(price)}</Button>
      <p className="text-center text-sm text-fg-muted">Price shown before you book. Fuel adjustment and booking fee added at checkout.</p>
    </form>
  );
}
