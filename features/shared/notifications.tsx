"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState, Row } from "@/components/ui/primitives";
import { useAlerts } from "@/lib/store/alerts";
import { useBooking } from "@/lib/store/booking";
import { cn } from "@/lib/cn";

export type Who = "rider" | "driver" | "operator";

/** One notifications screen for all three apps. Each role has its own inbox. */
export function NotificationsView({ who }: { who: Who }) {
  const rider = useBooking();
  const alerts = useAlerts();
  const items = who === "rider" ? rider.notifications : alerts[who];
  const markAll = () => (who === "rider" ? rider.markAllRead() : alerts.markAllRead(who));
  const markOne = (id: string) => (who === "rider" ? rider.markRead(id) : alerts.markRead(who, id));
  const unread = items.filter((n) => n.unread).length;
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Notifications" sub={unread ? `${unread} unread` : "You’re all caught up"} right={unread ? <Button size="sm" variant="outline" onClick={markAll}>Mark all read</Button> : undefined} />
      {items.length === 0 ? (
        <EmptyState title="Nothing yet" body="Trip updates, payouts and reminders will show up here." />
      ) : (
        <ul className="stagger grid gap-2.5">
          {items.map((n, i) => (
            <li key={n.id} style={{ "--i": i } as React.CSSProperties}>
              <button type="button" onClick={() => markOne(n.id)} className={cn("pressable block w-full rounded-xl border-2 px-4 text-left transition-colors", n.unread ? "border-outline bg-primary-soft hover:bg-primary-soft/80" : "border-line bg-surface hover:bg-surface-sunken")}>
                <Row icon={n.icon} tone={n.unread ? "primary" : "neutral"} title={n.title} sub={n.body} right={<span className="shrink-0 self-start pt-1 text-caption font-semibold text-fg-disabled">{n.time}</span>} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
