"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Segmented } from "@/components/ui/form";
import { Card, Row } from "@/components/ui/primitives";
import { formatNaira } from "@/lib/format";
import { useDriver } from "@/lib/store/driver";
import { cn } from "@/lib/cn";

const WEEK = [60, 92, 70, 120, 100, 44, 20];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Earnings() {
  const balance = useDriver((s) => s.balance);
  const [range, setRange] = useState<"week" | "month">("week");
  const mult = range === "week" ? 1 : 4.1;
  const rows = [["car", "Fares", 92400], ["trend", "MYWAY commission · 10%", -9240], ["fuel", "Fuel cashback", 2300], ["star", "Tips", 940]] as const;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Earnings" right={<Segmented label="Range" value={range} onChange={setRange} options={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }]} />} />
      <section aria-label="Summary" className="space-y-1">
        <p className="text-sm font-semibold text-fg-muted">This {range}</p>
        <p className="font-display text-6xl font-extrabold tracking-[-0.04em]">{formatNaira(Math.round(86400 * mult))}</p>
        <p className="text-sm font-semibold text-success-text">{Math.round(23 * mult)} trips · {Math.round(78 * mult)} riders · up 12%</p>
      </section>
      <div className="flex h-40 items-end justify-between gap-2.5" role="img" aria-label="Earnings by day, highest on Thursday">
        {WEEK.map((h, i) => <div key={i} className="flex flex-1 flex-col items-center gap-2"><span className={cn("w-full rounded-xl transition-[height] duration-500 ease-out-strong", i === 3 ? "bg-primary" : "bg-surface-sunken")} style={{ height: h * (range === "week" ? 1 : 1.1) }} /><span className={cn("text-xs font-bold", i === 3 ? "text-primary" : "text-fg-muted")}>{DAYS[i]}</span></div>)}
      </div>
      <Card className="divide-y divide-line p-3">
        {rows.map(([ic, t, v]) => <Row key={t} icon={ic} title={t} right={<span className={cn("font-display text-lg font-extrabold", v < 0 ? "text-danger-text" : v < 3000 && v > 0 && t !== "Fares" ? "text-success-text" : "")}>{(v < 0 ? "-" : t === "Fares" ? "" : "+") + formatNaira(Math.abs(Math.round(v * mult)))}</span>} />)}
      </Card>
      <Card tone="inverse" className="flex items-center justify-between gap-4 p-5"><div><p className="text-sm text-secondary-fg/70">Available to withdraw</p><p className="font-display text-3xl font-extrabold">{formatNaira(balance)}</p></div><ButtonLink href="/drive/withdraw" icon="bank">Withdraw</ButtonLink></Card>
    </div>
  );
}
