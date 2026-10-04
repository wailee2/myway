"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge, Card, EmptyState, Eyebrow } from "@/components/ui/primitives";
import { BUS_LINES, SEAT_COLS, SEAT_ROWS, getLine } from "@/lib/data/bus";
import { formatNaira } from "@/lib/format";
import { useBooking } from "@/lib/store/booking";
import { cn } from "@/lib/cn";

/* ----------------------------- LIST ----------------------------- */
export function BusList() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Bus lines" back="/app" sub="Scheduled corridors with a fixed timetable" />
      <ul className="stagger grid gap-3">
        {BUS_LINES.map((l, i) => (
          <li key={l.id} style={{ "--i": i } as React.CSSProperties}>
            <Link href={`/app/bus/${l.id}`} className="pressable flex items-center gap-4 rounded-xl border-2 border-line bg-surface p-4 transition-colors hover:border-line-strong">
              <span className="grid size-14 shrink-0 place-items-center rounded-[1rem] bg-secondary font-display text-xl font-extrabold text-primary">{l.id}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{l.from} → {l.to}</span>
                <span className="block text-sm text-fg-muted">{l.duration} · {l.headway} · {l.stops.length} stops</span>
                <span className="mt-1.5 flex flex-wrap gap-1.5">{l.departures.slice(0, 3).map((d) => <Badge key={d.time} tone={d.left < 6 ? "danger" : "neutral"}>{d.time}</Badge>)}</span>
              </span>
              <span className="text-right"><span className="block font-display text-xl font-extrabold">{formatNaira(l.price)}</span><Icon name="chevR" size={18} className="ml-auto text-fg-disabled" /></span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <ButtonLink href="/app/passes" icon="ticket">Commuter passes</ButtonLink>
        <ButtonLink href="/app/request-route" variant="outline" icon="route">Request a route</ButtonLink>
      </div>
    </div>
  );
}

/* ----------------------------- LINE + SEAT MAP ----------------------------- */
function Seat({ id, state, onClick }: { id: string; state: "free" | "taken" | "mine"; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={state === "taken"}
      aria-pressed={state === "mine"}
      aria-label={`Seat ${id}, ${state === "taken" ? "taken" : state === "mine" ? "selected" : "free"}`}
      onClick={onClick}
      className={cn("pressable grid size-11 place-items-center rounded-[0.75rem] border-2 text-xs font-extrabold sm:size-12", state === "taken" ? "border-line bg-surface-sunken text-fg-disabled" : state === "mine" ? "border-outline bg-primary text-primary-fg shadow-hard" : "border-line-strong bg-surface hover:bg-surface-sunken")}
    >
      {state === "taken" ? <Icon name="x" size={16} /> : id}
    </button>
  );
}

export function BusLine({ lineId }: { lineId: string }) {
  const router = useRouter();
  const line = getLine(lineId);
  const setDraft = useBooking((s) => s.setDraft);
  const [time, setTime] = useState(line?.departures[2]?.time ?? line?.departures[0]?.time ?? "");
  const [seats, setSeats] = useState<string[]>([]);
  if (!line) return <EmptyState title="Line not found" body="That bus line does not exist." action={<ButtonLink href="/app/bus">See bus lines</ButtonLink>} />;

  const toggle = (id: string) => setSeats((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(-4)));
  const total = line.price * seats.length;
  const go = () => {
    setDraft({ lineId: line.id, busTime: time, busSeats: seats, payment: "wallet" });
    router.push("/app/checkout?kind=bus");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_26rem] lg:gap-10">
      <section aria-labelledby="line-title" className="space-y-6">
        <PageHeader title={`Line ${line.id}`} back="/app/bus" />
        <Card tone="primary" className="flex items-center gap-4 p-5">
          <span className="grid size-14 shrink-0 place-items-center rounded-[1rem] bg-secondary font-display text-xl font-extrabold text-primary">{line.id}</span>
          <div><h2 id="line-title" className="text-title">{line.from} → {line.to}</h2><p className="text-sm font-semibold text-primary-fg/80">{line.duration} · {line.stops.length} stops · {line.bus}</p></div>
        </Card>

        <div className="space-y-2.5"><Eyebrow>Departures today</Eyebrow>
          <div className="rail" role="radiogroup" aria-label="Departure time">
            {line.departures.map((d) => (
              <button key={d.time} type="button" role="radio" aria-checked={time === d.time} onClick={() => setTime(d.time)} className={cn("pressable rounded-xl border-2 px-4 py-2.5 text-center", time === d.time ? "border-outline bg-secondary text-secondary-fg" : "border-line bg-surface hover:border-line-strong")}>
                <span className={cn("block font-display text-xl font-extrabold", time === d.time && "text-primary")}>{d.time}</span>
                <span className={cn("block text-caption font-bold", d.left < 6 ? "text-danger-text" : time === d.time ? "text-secondary-fg/80" : "text-success-text")}>{d.left} left</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5"><Eyebrow>Stops</Eyebrow>
          <ol className="rounded-xl border border-line bg-surface p-4">
            {line.stops.map((s, i) => (
              <li key={s.name} className="flex gap-4">
                <span className="flex w-4 flex-col items-center"><span className={cn("mt-1.5 size-3.5 rounded-full border-[3px] border-outline", i === 0 ? "bg-primary" : i === line.stops.length - 1 ? "rounded-[4px] bg-outline" : "bg-surface")} />{i < line.stops.length - 1 && <span className="my-0.5 w-[3px] flex-1 bg-outline" />}</span>
                <span className="flex flex-1 justify-between pb-4 last:pb-0"><span className={i === 0 || i === line.stops.length - 1 ? "font-bold" : "font-semibold"}>{s.name}</span><span className="font-bold text-fg-muted">{s.time}</span></span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="seat-title" className="space-y-4 lg:pt-14">
        <h2 id="seat-title" className="text-title">Pick your seat{seats.length > 1 ? "s" : ""}</h2>
        <ul className="flex gap-4 text-sm font-semibold text-fg-muted" aria-label="Legend">
          {[["bg-surface border-line-strong", "Free"], ["bg-primary border-outline", "Yours"], ["bg-surface-sunken border-line", "Taken"]].map(([c, l]) => <li key={l} className="flex items-center gap-1.5"><span className={cn("size-4 rounded-[5px] border-2", c)} />{l}</li>)}
        </ul>
        <div className="mx-auto w-fit rounded-[2rem] border-4 border-outline bg-surface p-5">
          <div className="mb-3 flex items-center justify-between"><span className="text-[0.6875rem] font-extrabold uppercase tracking-[0.2em] text-fg-disabled">Front</span><span className="grid size-11 place-items-center rounded-full bg-secondary text-primary"><Icon name="bus" size={20} /></span></div>
          <div className="grid gap-2.5">
            {Array.from({ length: SEAT_ROWS }, (_, r) => (
              <div key={r} className="flex items-center gap-2.5">
                {SEAT_COLS.map((c, ci) => {
                  const id = `${r + 1}${c}`;
                  return (
                    <span key={id} className={cn("contents")}>
                      {ci === 2 && <span className="w-5" aria-hidden="true" />}
                      <Seat id={id} state={line.takenSeats.includes(id) ? "taken" : seats.includes(id) ? "mine" : "free"} onClick={() => toggle(id)} />
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-end justify-between"><p className="font-semibold" aria-live="polite">{seats.length ? `Seat${seats.length > 1 ? "s" : ""} ${seats.join(", ")} · ${time} bus` : "Select up to 4 seats"}</p><p className="font-display text-3xl font-extrabold">{formatNaira(total)}</p></div>
        <Button size="lg" full iconRight="arrowR" disabled={!seats.length} onClick={go}>Continue to pay</Button>
      </section>
    </div>
  );
}

