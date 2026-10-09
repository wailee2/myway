"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/primitives";
import { SEED_REVIEWS } from "@/lib/data/misc";

function Stars({ n }: { n: number }) {
  return <span className="flex gap-0.5 text-warning" role="img" aria-label={`${n} out of 5 stars`}>{[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="star" size={14} fill={i <= n ? "currentColor" : "none"} className={i <= n ? "" : "text-fg-disabled"} />)}</span>;
}

export function Reviews() {
  const dist = [[5, 86], [4, 11], [3, 2], [2, 1], [1, 0]] as const;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Ratings and reviews" back="/drive/profile" />
      <section className="flex items-center gap-5 rounded-xl border border-line bg-surface p-4" aria-label="Rating summary">
        <div className="text-center"><p className="font-display text-5xl font-extrabold leading-none">4.9</p><Stars n={5} /><p className="mt-1 text-caption text-fg-muted">312 trips</p></div>
        <ul className="grid flex-1 gap-1.5">
          {dist.map(([s, pct]) => (
            <li key={s} className="flex items-center gap-2 text-caption font-bold text-fg-muted"><span className="w-3">{s}</span><span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken"><span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></span><span className="w-8 text-right tabular-nums">{pct}%</span></li>
          ))}
        </ul>
      </section>
      <ul className="grid gap-3">
        {SEED_REVIEWS.map((r) => (
          <li key={r.id} className="space-y-2 rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center gap-3"><Avatar name={r.name} size={36} tone="ink" /><div className="min-w-0 flex-1"><p className="font-bold leading-tight">{r.name}</p><Stars n={r.stars} /></div><span className="text-caption font-semibold text-fg-disabled">{r.when}</span></div>
            <p className="text-fg-muted">{r.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
