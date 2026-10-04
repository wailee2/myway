"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Segmented } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { CarArt } from "@/components/illustrations/vehicles";
import { formatNaira } from "@/lib/format";
import { useBooking } from "@/lib/store/booking";
import type { BookingStatus } from "@/lib/types";

const TONE = { upcoming: "primary", completed: "success", cancelled: "danger" } as const;

export function MyTrips() {
  const bookings = useBooking((s) => s.bookings);
  const [tab, setTab] = useState<BookingStatus>("upcoming");
  const list = bookings.filter((b) => b.status === tab).sort((a, b) => b.createdAt - a.createdAt);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="My trips" />
      <Segmented label="Trip status" value={tab} onChange={setTab} options={[{ value: "upcoming", label: "Upcoming" }, { value: "completed", label: "Past" }, { value: "cancelled", label: "Cancelled" }]} className="mb-5" />
      {list.length ? (
        <ul className="stagger grid gap-3" key={tab}>
          {list.map((b, i) => (
            <li key={b.id} style={{ "--i": i } as React.CSSProperties}>
              <Link href={`/app/booking/${b.id}`} className="pressable block space-y-3 rounded-xl border-2 border-line bg-surface p-4 transition-colors hover:border-line-strong">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-[0.875rem] bg-primary text-primary-fg"><Icon name={b.kind === "car" ? "car" : "bus"} size={22} /></span>
                  <span className="min-w-0 flex-1"><span className="block font-bold leading-snug">{b.title}</span><span className="mt-0.5 block text-sm text-fg-muted">{b.sub}</span></span>
                  <span className="flex shrink-0 flex-col items-end gap-1.5"><span className="font-display text-xl font-extrabold leading-none tracking-[-0.03em]">{b.time}</span><Badge tone={TONE[b.status]}>{b.status === "completed" ? "Done" : b.status}</Badge></span>
                </div>
                {b.status === "upcoming" && b.kind === "car" && (
                  <div className="flex items-center justify-between rounded-lg bg-secondary px-3.5 py-2.5 text-secondary-fg"><span className="text-sm font-semibold">Boarding code</span><span className="font-display text-lg font-extrabold tracking-[0.25em] text-primary">{b.code}</span></div>
                )}
                {b.status !== "upcoming" && <p className="text-sm text-fg-muted">{formatNaira(b.total)} · {b.payment}</p>}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={`No ${tab === "completed" ? "past" : tab} trips`} body="When you book a seat it will show up here." action={<ButtonLink href="/app" icon="search">Find a seat</ButtonLink>}><CarArt className="w-40" /></EmptyState>
      )}
    </div>
  );
}
