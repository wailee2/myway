"use client";

import { useRef, useState } from "react";
import { Dialog, openDialog } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Banner, Eyebrow } from "@/components/ui/primitives";
import { AREAS, POPULAR_STOP_IDS, STOPS, areaName, getArea, getStop } from "@/lib/data/stops";
import { distanceM, formatDistance, walkMinutes } from "@/lib/geo";
import { useRider } from "@/lib/store/rider";
import type { Stop } from "@/lib/types";
import { cn } from "@/lib/cn";

type Mode = "pickup" | "dropoff";
type Loc = "idle" | "loading" | "error";

const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

/** A stop matches on its name, landmark, area or any alias (estates, junctions, malls…). */
function matches(s: Stop, q: string) {
  const hay = [s.name, s.landmark, getArea(s.areaId)?.name ?? "", ...s.aliases].map(norm);
  return hay.some((h) => h.includes(q));
}

/**
 * Location search sheet: autocomplete, recent places, popular places, landmarks as search terms,
 * "near me", and every stop inside an area ("Jabi" lists all Jabi stops). Designated stops only.
 */
export function LocationSheet({ dialogRef, mode, other, onPick }: { dialogRef: React.RefObject<HTMLDialogElement | null>; mode: Mode; /** The stop chosen for the other field. */ other?: string; onPick: (s: Stop) => void }) {
  const recents = useRider((s) => s.recents);
  const setLocation = useRider((s) => s.setLocation);
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState<Loc>("idle");
  const [near, setNear] = useState<{ stop: Stop; d: number }[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allowed = (s: Stop) => (mode === "pickup" ? s.pickup : s.dropoff);
  const reason = (s: Stop) => (s.id === other ? (mode === "pickup" ? "Already your drop-off" : "Already your pickup") : !allowed(s) ? (mode === "pickup" ? "Drop-off only" : "Pickup only") : null);

  const reset = () => { setQ(""); setLoc("idle"); setNear(null); };
  const pick = (s: Stop) => { onPick(s); dialogRef.current?.close(); };

  const locate = () => {
    setLoc("loading");
    if (!("geolocation" in navigator)) return setLoc("error");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(here);
        const list = STOPS.filter((s) => allowed(s) && s.id !== other).map((stop) => ({ stop, d: distanceM(here, stop) })).sort((a, b) => a.d - b.d).slice(0, 3);
        setNear(list);
        setLoc("idle");
      },
      () => setLoc("error"),
      { timeout: 8000, maximumAge: 60_000 },
    );
  };

  const query = norm(q);
  const found = query ? STOPS.filter((s) => matches(s, query)) : [];
  const grouped = AREAS.map((a) => ({ area: a, stops: found.filter((s) => s.areaId === a.id) })).filter((g) => g.stops.length);

  const row = (s: Stop, extra?: string) => {
    const off = reason(s);
    return (
      <li key={s.id}>
        <button type="button" disabled={Boolean(off)} onClick={() => pick(s)} className="pressable flex min-h-14 w-full items-center gap-3.5 rounded-lg px-1 py-2 text-left hover:bg-surface-sunken disabled:opacity-55">
          <span className="grid size-11 shrink-0 place-items-center rounded-[0.875rem] bg-surface-sunken"><Icon name="pin" size={20} /></span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold">{s.name}</span>
            <span className="block truncate text-sm text-fg-muted">{off ?? `${areaName(s.id)} · ${s.landmark}`}</span>
          </span>
          {extra && <span className="shrink-0 text-sm font-bold text-fg-secondary">{extra}</span>}
        </button>
      </li>
    );
  };

  return (
    <Dialog dialogRef={dialogRef} title={mode === "pickup" ? "Where from?" : "Where to?"} tall onClosed={reset}>
      <div className="relative mb-3 shrink-0">
        <Icon name="search" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted" />
        <input
          ref={inputRef}
          data-autofocus
          type="search"
          inputMode="search"
          autoComplete="off"
          enterKeyHint="search"
          aria-label={mode === "pickup" ? "Search for a pickup stop" : "Search for a drop-off stop"}
          placeholder="Stop, area, estate or landmark"
          value={q}
          onChange={(e) => { setQ(e.target.value); setNear(null); }}
          className="h-14 w-full rounded-lg border-2 border-line bg-surface-sunken pl-12 pr-4 text-base font-bold outline-none placeholder:font-semibold placeholder:text-fg-disabled focus:border-line-strong focus:bg-surface"
        />
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
        {!query && (
          <>
            <button type="button" onClick={locate} disabled={loc === "loading"} className="pressable flex min-h-14 w-full items-center gap-3.5 rounded-lg border-2 border-line-strong px-3 text-left font-bold hover:bg-surface-sunken disabled:opacity-60">
              <Icon name="nav" size={20} />
              <span className="flex-1">{loc === "loading" ? "Finding stops near you…" : "Use my location"}</span>
            </button>

            {loc === "error" && (
              <Banner tone="warning" icon="alert">
                <p>We couldn’t determine your location.</p>
                <button type="button" onClick={() => { setLoc("idle"); inputRef.current?.focus(); }} className="mt-1.5 font-extrabold underline underline-offset-4">Choose location manually</button>
              </Banner>
            )}

            {near && (
              <section aria-label="Closest stops">
                <Eyebrow>Closest to you</Eyebrow>
                <ul className="mt-1.5">{near.map(({ stop, d }) => row(stop, `${formatDistance(d)} · ${walkMinutes(d)} min walk`))}</ul>
              </section>
            )}

            {recents.length > 0 && (
              <section aria-label="Recent places">
                <Eyebrow>Recent</Eyebrow>
                <ul className="mt-1.5">{recents.map((id) => getStop(id)).filter((s): s is Stop => Boolean(s)).map((s) => row(s))}</ul>
              </section>
            )}

            <section aria-label="Popular places">
              <Eyebrow>Popular places</Eyebrow>
              <ul className="mt-1.5">{POPULAR_STOP_IDS.map((id) => getStop(id)).filter((s): s is Stop => Boolean(s)).map((s) => row(s))}</ul>
            </section>
          </>
        )}

        {query && (
          <div aria-live="polite">
            {grouped.length ? (
              grouped.map((g) => (
                <section key={g.area.id} aria-label={g.area.name} className="mb-4">
                  <Eyebrow className="flex items-center gap-2">{g.area.name}<span className={cn("rounded-full bg-surface-sunken px-2 py-0.5 text-[0.6875rem] normal-case tracking-normal")}>{g.stops.length} {g.stops.length === 1 ? "stop" : "stops"}</span></Eyebrow>
                  <ul className="mt-1.5">{g.stops.map((s) => row(s))}</ul>
                </section>
              ))
            ) : (
              <div className="space-y-1 py-8 text-center">
                <p className="font-bold">No stops match “{q.trim()}”</p>
                <p className="text-sm text-fg-muted">Try an area, estate, junction or landmark. MYWAY uses set stops so every pickup is easy to find.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}

export { openDialog };
