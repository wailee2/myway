"use client";

import { Icon } from "@/components/ui/icon";
import { formatNaira } from "@/lib/format";
import { FRONT_SEAT_PREMIUM, SEAT_LABEL } from "@/lib/pricing";
import type { SeatId } from "@/lib/types";
import { cn } from "@/lib/cn";

const SEATS: SeatId[] = ["front", "back-l", "back-m", "back-r"];

export function CarSeatPicker({ taken, value, onChange, base }: { taken: SeatId[]; value: SeatId; onChange: (s: SeatId) => void; base: number }) {
  const cell = (id: SeatId) => {
    const isTaken = taken.includes(id);
    const on = value === id;
    return (
      <button
        key={id}
        type="button"
        disabled={isTaken}
        aria-pressed={on}
        aria-label={`${SEAT_LABEL[id]}, ${isTaken ? "taken" : formatNaira(id === "front" ? base + FRONT_SEAT_PREMIUM : base)}`}
        onClick={() => onChange(id)}
        className={cn(
          "pressable flex h-[4.5rem] flex-1 flex-col items-center justify-center gap-1 rounded-[1rem] border-2 text-xs font-extrabold",
          isTaken ? "border-line bg-surface-sunken text-fg-disabled" : on ? "border-outline bg-primary text-primary-fg shadow-hard" : "border-line-strong bg-surface text-fg hover:bg-surface-sunken",
        )}
      >
        <Icon name={isTaken ? "x" : on ? "check" : "user"} size={20} strokeWidth={isTaken || on ? 3 : 2} />
        {SEAT_LABEL[id].replace("Back ", "").replace(" seat", "")}
      </button>
    );
  };
  return (
    <div className="space-y-3 rounded-xl bg-surface-sunken p-4" role="group" aria-label="Choose your seat">
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="grid h-[4.5rem] w-14 shrink-0 flex-col place-items-center rounded-[1rem] bg-secondary text-primary"><Icon name="car" size={22} /></span>
        {cell("front")}
        <span className="flex-1" />
      </div>
      <div className="flex gap-2.5">{SEATS.slice(1).map(cell)}</div>
      <p className="text-sm text-fg-muted">Front seat is {formatNaira(FRONT_SEAT_PREMIUM)} extra. Four passengers maximum.</p>
    </div>
  );
}
