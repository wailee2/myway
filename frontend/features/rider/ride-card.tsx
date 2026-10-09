import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Avatar, Badge, SeatDots } from "@/components/ui/primitives";
import { getDriver, type RideMatch } from "@/lib/data/trips";
import { getRoute } from "@/lib/data/stops";
import { formatNaira, formatTime, ratingLabel } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Card hierarchy (roadmap Phase 3):
 *   1 Time  ·  2 Driver  ·  3 Availability + all-in price  ·  4 Supporting detail (vehicle, route, badges, reasons)
 */
export function RideCard({ match, day, highlight, reasons }: { match: RideMatch; day: number; highlight?: boolean; reasons: string[] }) {
  const { trip, pickup, dropoff } = match;
  const d = getDriver(trip.driverId);
  const left = match.seatsLeft;
  const full = left === 0;
  const route = getRoute(trip.routeId);
  const body = (
    <>
      <p className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-[-0.03em]">
        {formatTime(match.pickupTime)}<Icon name="arrowR" size={18} className="text-fg-muted" /><span className="text-fg-muted">{formatTime(match.dropoffTime)}</span>
      </p>

      <div className="mt-3 flex items-center gap-3">
        <Avatar name={d.name} size={40} />
        <p className="min-w-0 flex-1 text-sm font-bold">
          <span className="flex flex-wrap items-center gap-x-1.5">
            {d.name}
            {d.verified && <Icon name="badge" size={15} className="text-success" strokeWidth={2.4} aria-label="Verified driver" />}
            <span className="inline-flex items-center gap-0.5 font-semibold text-fg-muted"><Icon name="star" size={12} className="fill-warning text-warning" />{d.rating ?? "New"}</span>
          </span>
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-surface-sunken px-3.5 py-2.5">
        <span className="flex items-center gap-2.5">
          <SeatDots taken={match.taken.length} />
          <span className={cn("text-sm font-bold", left <= 1 ? "text-danger-text" : "text-success-text")}>{full ? "Full" : `${left} seat${left > 1 ? "s" : ""} left`}</span>
        </span>
        <span className="font-display text-xl font-extrabold">{formatNaira(trip.price)}</span>
      </div>

      <p className="mt-2.5 truncate text-sm text-fg-muted">{d.color} {d.make} · {pickup.name} → {dropoff.name}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {trip.womenOnly && <Badge tone="info" icon="shield">Women only</Badge>}
        {route && <Badge tone="neutral">{route.stops.length} stops</Badge>}
      </div>
      {reasons.length > 0 && (
        <ul className="mt-2.5 space-y-1">
          {reasons.map((r) => <li key={r} className="flex items-start gap-2 text-sm font-semibold text-fg-secondary"><Icon name="check" size={15} strokeWidth={3} className="mt-1 shrink-0 text-success" />{r}</li>)}
        </ul>
      )}
    </>
  );
  const cls = cn("pressable block rounded-xl border-2 p-4 transition-colors", highlight ? "border-outline bg-primary-soft shadow-hard" : "border-line bg-surface hover:border-line-strong", full && "pointer-events-none opacity-60");
  if (full) return <div className={cls} aria-disabled="true">{body}</div>;
  return <Link href={`/app/trip/${trip.id}?from=${pickup.id}&to=${dropoff.id}&day=${day}`} className={cls}>{body}</Link>;
}
