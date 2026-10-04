"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Row } from "@/components/ui/primitives";
import { useBooking } from "@/lib/store/booking";
import { cn } from "@/lib/cn";

export function Notifications() {
  const { notifications, markAllRead } = useBooking();
  const unread = notifications.filter((n) => n.unread).length;
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Notifications" right={unread ? <Button size="sm" variant="outline" onClick={markAllRead}>Mark all read</Button> : undefined} />
      <ul className="stagger grid gap-2.5">
        {notifications.map((n, i) => (
          <li key={n.id} style={{ "--i": i } as React.CSSProperties} className={cn("rounded-xl border-2 px-4", n.unread ? "border-outline bg-primary-soft" : "border-line bg-surface")}>
            <Row icon={n.icon} tone={n.unread ? "primary" : "neutral"} title={n.title} sub={n.body} right={<span className="text-caption font-semibold text-fg-disabled">{n.time}</span>} />
          </li>
        ))}
      </ul>
    </div>
  );
}
