"use client";

import { Icon } from "@/components/ui/icon";
import { formatNaira } from "@/lib/format";
import { FRONT_SEAT_PREMIUM, SEAT_LABEL } from "@/lib/pricing";
import type { SeatId } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Seat diagram, seen from above: the driver sits front-left, so the front passenger seat is front-right.
 *   [ Driver ]  [        ]  [ Front seat ]
 *   [ Behind driver ] [ Middle ] [ Right window ]
 */
export function CarSeatPicker({ taken, value, onChange }: { taken: SeatId[]; value: SeatId; onChange: (s: SeatId) => void }) {
  const cell = (id: SeatId) => {
    const isTaken = taken.includes(id);
    const on = value === id;
    return (
      <button
        key={id}
        type="button"
        disabled={isTaken}
        aria-pressed={on}
        aria-label={`${SEAT_LABEL[id]}${id === "front" ? ", beside the driver" : ""}, ${isTaken ? "already booked" : on ? "selected" : id === "front" ? `${formatNaira(FRONT_SEAT_PREMIUM)} extra` : "available"}`}
        onClick={() => onChange(id)}
        className={cn(
          "pressable flex min-h-[4.75rem] flex-col items-center justify-center gap-0.5 rounded-[1rem] border-2 px-1 text-xs font-bold leading-tight",
          isTaken ? "border-line bg-surface-sunken text-fg-disabled" : on ? "border-outline bg-primary text-primary-fg shadow-hard" : "border-line-strong bg-surface text-fg hover:bg-surface-sunken",
        )}
      >
        <Icon name={isTaken ? "x" : on ? "check" : "user"} size={20} strokeWidth={isTaken || on ? 3 : 2} />
        <span>{SEAT_LABEL[id]}</span>
        <span className="text-[0.6875rem] font-semibold opacity-80">{isTaken ? "Booked" : id === "front" ? `+${formatNaira(FRONT_SEAT_PREMIUM)}` : on ? "Yours" : "Free"}</span>
      </button>
    );
  };
  return (
    <div className="space-y-2.5 rounded-xl bg-surface-sunken p-3.5" role="group" aria-label="Choose a seat">
      <div className="grid grid-cols-3 gap-2.5">
        <div className="flex min-h-[4.75rem] flex-col items-center justify-center gap-0.5 rounded-[1rem] bg-secondary text-xs font-bold text-secondary-fg" role="img" aria-label="Driver's seat, not available">
          <Icon name="car" size={20} className="text-primary" />
          <span>Driver</span>
        </div>
        <span aria-hidden="true" />
        {cell("front")}
      </div>
      <div className="grid grid-cols-3 gap-2.5">{(["back-l", "back-m", "back-r"] as SeatId[]).map(cell)}</div>
    </div>
  );
}
