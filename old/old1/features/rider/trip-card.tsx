import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Avatar, Badge, SeatDots } from "@/components/ui/primitives";
import { getDriver } from "@/lib/data/trips";
import { formatNaira } from "@/lib/format";
import type { CarTrip } from "@/lib/types";
import { cn } from "@/lib/cn";

export function TripCard({ trip, highlight }: { trip: CarTrip; highlight?: boolean }) {
  const d = getDriver(trip.driverId);
  const left = 4 - trip.taken.length;
  const full = left === 0;
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-[-0.03em]">
          {trip.depart}<Icon name="arrowR" size={18} className="text-fg-muted" /><span className="text-fg-muted">{trip.arrive}</span>
        </p>
        <p className="font-display text-xl font-extrabold">{formatNaira(trip.price)}</p>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Avatar name={d.name} size={38} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-bold">{d.name}<Icon name="badge" size={15} className="text-success" strokeWidth={2.4} /><span className="inline-flex items-center gap-0.5 text-fg-muted"><Icon name="star" size={12} className="fill-warning text-warning" />{d.rating}</span></p>
          <p className="truncate text-caption text-fg-muted">{d.car}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <SeatDots taken={trip.taken.length} />
          <span className={cn("text-caption font-bold", full ? "text-danger-text" : left === 1 ? "text-danger-text" : "text-success-text")}>{full ? "Full" : `${left} seat${left > 1 ? "s" : ""} left`}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={highlight ? "primary" : "neutral"} icon="clock">{trip.tag}</Badge>
        {trip.womenOnly && <Badge tone="info" icon="shield">Women-only</Badge>}
      </div>
    </>
  );
  const cls = cn("pressable block rounded-xl border-2 p-4 transition-colors", highlight ? "border-outline bg-primary-soft shadow-hard" : "border-line bg-surface hover:border-line-strong", full && "pointer-events-none opacity-60");
  return full ? <div className={cls} aria-disabled="true">{body}</div> : <Link href={`/app/trip/${trip.id}`} className={cls}>{body}</Link>;
}
