"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { Card, EmptyState } from "@/components/ui/primitives";
import { stopName } from "@/lib/data/stops";
import { describeDays, WEEKDAYS, WEEKDAY_SHORT } from "@/lib/format";
import { useRider } from "@/lib/store/rider";
import { cn } from "@/lib/cn";

/** Manage saved "usual routes": route, days and approximate time. */
export function UsualRoutes() {
  const { usualRoutes, updateUsual, removeUsual } = useRider();
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Usual routes" back="/app/profile" sub="We’ll show these on Home and tell you when a ride is available" />
      {usualRoutes.length === 0 ? (
        <EmptyState title="No usual routes yet" body="After you book a ride, tap “Save as usual ride” and it will appear here." action={<ButtonLink href="/app" icon="search">Find a ride</ButtonLink>} />
      ) : (
        <ul className="grid gap-3">
          {usualRoutes.map((u) => (
            <li key={u.id}>
              <Card className="space-y-3.5 border-2 border-line">
                <div><p className="font-display text-lg font-extrabold">{stopName(u.fromId)} → {stopName(u.toId)}</p><p className="text-sm text-fg-secondary">{describeDays(u.days)}</p></div>
                <div className="flex gap-1.5" role="group" aria-label="Days you travel">
                  {WEEKDAY_SHORT.map((d, i) => { const on = u.days.includes(i); return <button key={i} type="button" aria-pressed={on} aria-label={WEEKDAYS[i]} onClick={() => updateUsual(u.id, { days: on ? u.days.filter((x) => x !== i) : [...u.days, i] })} className={cn("pressable size-11 rounded-full font-bold", on ? "bg-secondary text-primary" : "border border-line bg-surface text-fg-muted")}>{d}</button>; })}
                </div>
                <Field label="Approximate time" type="time" icon="clock" value={u.time} onChange={(e) => updateUsual(u.id, { time: e.target.value })} />
                <div className="grid grid-cols-2 gap-2.5">
                  <ButtonLink href={`/app/search?from=${u.fromId}&to=${u.toId}`} icon="search">Find my ride</ButtonLink>
                  <Button variant="danger" onClick={() => removeUsual(u.id)}>Remove</Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
