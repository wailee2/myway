"use client";

import { useState } from "react";
import { Danfo } from "@/components/illustrations/vehicles";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge, Banner } from "@/components/ui/primitives";
import { BUS_PASSES } from "@/lib/data/bus";
import { formatNaira } from "@/lib/format";
import { useBooking } from "@/lib/store/booking";
import { cn } from "@/lib/cn";

export function Passes() {
  const [plan, setPlan] = useState<string>("monthly");
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const spend = useBooking((s) => s.spend);
  const sel = BUS_PASSES.find((p) => p.id === plan)!;

  const buy = () => {
    if (sel.price === null) return setMsg({ tone: "success", text: "Thanks. Our team will contact you about an employer account within 2 working days." });
    const ok = spend(sel.price, `${sel.name} commuter pass`, "bus");
    setMsg(ok ? { tone: "success", text: `Your ${sel.name.toLowerCase()} pass is active. Rides are taken from it automatically.` } : { tone: "danger", text: "Your wallet balance is too low. Top up and try again." });
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_20rem]">
      <section aria-labelledby="pass-title" className="space-y-4">
        <PageHeader title="Commuter passes" back="/app/bus" />
        <h2 id="pass-title" className="sr-only">Choose a plan</h2>
        <div role="radiogroup" aria-label="Pass plans" className="grid gap-3">
          {BUS_PASSES.map((p) => {
            const on = plan === p.id;
            return (
              <button key={p.id} type="button" role="radio" aria-checked={on} onClick={() => { setPlan(p.id); setMsg(null); }} className={cn("pressable rounded-xl border-2 p-5 text-left transition-colors", on ? "border-outline bg-primary text-primary-fg shadow-hard" : "border-line bg-surface hover:border-line-strong")}>
                <span className="flex items-center justify-between"><span className="font-display text-2xl font-extrabold">{p.name}</span>{p.tag && <Badge tone="ink">{p.tag}</Badge>}</span>
                <span className="mt-1 flex items-baseline gap-2"><span className="font-display text-4xl font-extrabold tracking-[-0.03em]">{p.price ? formatNaira(p.price) : "Custom"}</span><span className={cn("text-sm font-semibold", on ? "text-primary-fg/75" : "text-fg-muted")}>{p.unit}</span></span>
              </button>
            );
          })}
        </div>
        <ul className="space-y-2.5">{["Same seat class, every trip", "Priority boarding", "Pause any time, unused rides roll over"].map((t) => <li key={t} className="flex items-center gap-3 font-semibold"><span className="grid size-6 place-items-center rounded-full bg-secondary text-primary"><Icon name="check" size={14} strokeWidth={3.5} /></span>{t}</li>)}</ul>
        {msg && <Banner tone={msg.tone} icon={msg.tone === "success" ? "check" : "alert"}>{msg.text}</Banner>}
        <Button size="lg" full onClick={buy}>{sel.price ? `Get ${sel.name.toLowerCase()} pass · ${formatNaira(sel.price)}` : "Talk to our team"}</Button>
      </section>
      <div className="hidden self-center rounded-2xl bg-primary-soft p-6 lg:block"><Danfo className="w-full" /></div>
    </div>
  );
}
