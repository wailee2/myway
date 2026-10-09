"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Segmented } from "@/components/ui/form";
import { Card, Progress, Row } from "@/components/ui/primitives";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/cn";

const WEEK = [64, 88, 72, 110, 120, 52, 30];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ROUTES = [["N1 · Nyanya → CBD", 182400, 100], ["K2 · Kubwa → Wuse II", 141300, 77], ["L3 · Lugbe → Garki", 88700, 49]] as const;

export function Reports() {
  const [range, setRange] = useState<"week" | "month">("week");
  const m = range === "week" ? 1 : 4.2;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Reports" back="/operator/profile" right={<Segmented label="Range" value={range} onChange={setRange} options={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }]} />} />
      <section aria-label="Summary" className="space-y-1">
        <p className="text-sm font-semibold text-fg-muted">Revenue this {range}</p>
        <p className="font-display text-5xl font-extrabold tracking-[-0.04em]">{formatNaira(Math.round(412400 * m))}</p>
        <p className="text-sm font-semibold text-success-text">{Math.round(631 * m)} seats sold · up 8%</p>
      </section>
      <div className="flex h-36 items-end justify-between gap-2" role="img" aria-label="Revenue by day, highest on Friday">
        {WEEK.map((h, i) => <div key={i} className="flex flex-1 flex-col items-center gap-2"><span className={cn("w-full rounded-lg transition-[height] duration-500 ease-out-strong", i === 4 ? "bg-primary" : "bg-surface-sunken")} style={{ height: h }} /><span className={cn("text-xs font-bold", i === 4 ? "text-primary" : "text-fg-muted")}>{DAYS[i]}</span></div>)}
      </div>
      <section className="space-y-3" aria-labelledby="top-routes"><h2 id="top-routes" className="font-sans text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Top routes</h2>
        <Card className="space-y-4">{ROUTES.map(([t, v, p]) => <div key={t} className="space-y-1.5"><div className="flex items-center justify-between gap-3"><p className="min-w-0 flex-1 font-bold leading-snug">{t}</p><p className="shrink-0 font-display text-lg font-extrabold">{formatNaira(Math.round(v * (range === "week" ? 1 : 4.2)))}</p></div><Progress value={p} label={`${t} share of revenue`} /></div>)}</Card>
      </section>
      <Card><Row icon="bank" title="Next settlement" sub="Monday · Zenith •• 7712" right={<span className="shrink-0 font-display text-lg font-extrabold">{formatNaira(Math.round(412400 * 0.9))}</span>} /></Card>
    </div>
  );
}
