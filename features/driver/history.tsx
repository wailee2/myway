"use client";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, Row } from "@/components/ui/primitives";
import { stopName } from "@/lib/data/stops";
import { formatNaira } from "@/lib/format";
import { useDriver } from "@/lib/store/driver";

export function TripHistory() {
  const history = useDriver((s) => s.history);
  const total = history.reduce((a, h) => a + h.earned, 0);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Trip history" back="/drive/profile" sub={`${history.length} recent trips`} />
      {history.length === 0 ? <EmptyState title="No trips yet" body="Finished trips will show up here." /> : (
        <>
          <div className="rounded-xl bg-primary p-4 text-primary-fg"><p className="text-sm font-semibold text-primary-fg/80">Earned from these trips</p><p className="font-display text-3xl font-extrabold">{formatNaira(total)}</p></div>
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface px-4">
            {history.map((h) => (
              <li key={h.id}><Row icon="car" title={`${stopName(h.fromId)} → ${stopName(h.toId)}`} sub={`${h.when} · ${h.riders} riders`} right={<span className="shrink-0 font-display text-lg font-extrabold text-success-text">+{formatNaira(h.earned)}</span>} /></li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
