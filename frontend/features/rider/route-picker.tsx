"use client";

import { useDialog } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { areaName, getStop } from "@/lib/data/stops";
import { useRider } from "@/lib/store/rider";
import { cn } from "@/lib/cn";
import { LocationSheet } from "./location-sheet";

const field = "pressable flex min-h-16 w-full items-center gap-3.5 rounded-lg border-2 border-line bg-surface-sunken px-4 text-left transition-colors hover:border-line-strong";

/**
 * Pickup + drop-off fields. Tapping one opens the location search sheet (no native <select>).
 * `from` / `to` are stop ids, or "" while nothing is chosen.
 */
export function RoutePicker({ from, to, onChange }: { from: string; to: string; onChange: (v: { from: string; to: string }) => void; idPrefix?: string }) {
  const addRecent = useRider((s) => s.addRecent);
  const fromDlg = useDialog();
  const toDlg = useDialog();
  const a = getStop(from);
  const b = getStop(to);

  const slot = (kind: "pickup" | "dropoff") => {
    const stop = kind === "pickup" ? a : b;
    const dlg = kind === "pickup" ? fromDlg : toDlg;
    return (
      <button type="button" aria-haspopup="dialog" onClick={dlg.open} className={field}>
        <Icon name={kind === "pickup" ? "pin" : "flag"} size={22} className={stop ? "text-fg" : "text-fg-muted"} />
        <span className="min-w-0 flex-1">
          <span className="block text-caption font-semibold text-fg-muted">{kind === "pickup" ? "Pickup" : "Drop-off"}</span>
          <span className={cn("block truncate text-base font-bold", !stop && "font-semibold text-fg-disabled")}>{stop ? stop.name : kind === "pickup" ? "Where from?" : "Where to?"}</span>
          {stop && <span className="block truncate text-caption text-fg-muted">{areaName(stop.id)} · {stop.landmark}</span>}
        </span>
        <Icon name="chevR" size={18} className="shrink-0 text-fg-disabled" />
      </button>
    );
  };

  return (
    <div className="relative grid gap-2.5">
      {slot("pickup")}
      {slot("dropoff")}
      <button
        type="button"
        aria-label="Swap pickup and drop-off"
        disabled={!a || !b}
        onClick={() => onChange({ from: to, to: from })}
        className="pressable absolute right-12 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border-2 border-line bg-surface hover:bg-surface-sunken disabled:opacity-40"
      >
        <Icon name="swap" size={18} />
      </button>
      <LocationSheet dialogRef={fromDlg.ref} mode="pickup" other={to} onPick={(s) => { addRecent(s.id); onChange({ from: s.id, to }); }} />
      <LocationSheet dialogRef={toDlg.ref} mode="dropoff" other={from} onPick={(s) => { addRecent(s.id); onChange({ from, to: s.id }); }} />
    </div>
  );
}
