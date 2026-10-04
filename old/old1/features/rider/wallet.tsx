"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Banner, Chip, Eyebrow, Row } from "@/components/ui/primitives";
import { formatNaira, signedNaira } from "@/lib/format";
import { useBooking } from "@/lib/store/booking";
import { cn } from "@/lib/cn";

export function Wallet() {
  const { balance, transactions } = useBooking();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Wallet" />
      <section aria-label="Balance" className="rounded-2xl bg-secondary p-6 text-secondary-fg">
        <Eyebrow className="text-primary">MYWAY wallet</Eyebrow>
        <p className="my-2 font-display text-6xl font-extrabold tracking-[-0.04em]">{formatNaira(balance)}</p>
        <div className="flex flex-wrap gap-2.5">
          <ButtonLink href="/app/wallet/top-up" size="sm" icon="plus">Top up</ButtonLink>
          <ButtonLink href="/app/trips" size="sm" variant="outline" icon="history" className="!border-secondary-fg/30 !bg-transparent !text-secondary-fg">History</ButtonLink>
        </div>
      </section>
      <Banner tone="success" icon="fuel">₦150 fuel cashback earned this week</Banner>
      <section aria-labelledby="act-title"><h2 id="act-title" className="mb-1 font-sans text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Recent activity</h2>
        <ul className="divide-y divide-line">
          {transactions.slice(0, 12).map((t) => (
            <li key={t.id}><Row icon={t.icon} title={t.title} sub={t.sub} tone={t.amount > 0 ? "success" : "neutral"} right={<span className={cn("font-display text-lg font-extrabold", t.amount > 0 && "text-success-text")}>{signedNaira(t.amount)}</span>} /></li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function TopUp() {
  const router = useRouter();
  const topUp = useBooking((s) => s.topUp);
  const [amount, setAmount] = useState("5000");
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");
  const n = Number(amount.replace(/\D/g, ""));
  const copy = async () => {
    try { await navigator.clipboard.writeText("9012345678"); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { /* clipboard blocked */ }
  };
  const done = () => {
    if (n < 100) return setErr("The minimum top-up is ₦100.");
    topUp(n);
    router.push("/app/wallet");
  };
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Top up wallet" back="/app/wallet" />
      <Field label="Amount (₦)" inputMode="numeric" value={amount} onChange={(e) => { setAmount(e.target.value.replace(/\D/g, "")); setErr(""); }} error={err} icon="wallet" />
      <div className="rail" role="group" aria-label="Quick amounts">{[1000, 2000, 5000, 10000].map((v) => <Chip key={v} active={n === v} onClick={() => { setAmount(String(v)); setErr(""); }}>{formatNaira(v)}</Chip>)}</div>
      <section className="space-y-3 rounded-xl border-2 border-outline bg-primary-soft p-5" aria-labelledby="bt-title">
        <h2 id="bt-title" className="flex items-center gap-2.5 font-sans text-base font-bold"><Icon name="bank" size={20} />Bank transfer · instant</h2>
        <div className="flex items-center justify-between gap-3 rounded-lg bg-surface p-4">
          <div><p className="text-sm text-fg-muted">Wema Bank · MYWAY/Wailee</p><p className="font-display text-3xl font-extrabold tracking-[0.04em]">9012 345 678</p></div>
          <button type="button" onClick={copy} aria-label="Copy account number" className="pressable grid size-12 place-items-center rounded-full bg-surface-sunken"><Icon name={copied ? "check" : "copy"} size={20} /></button>
        </div>
        <p className="text-sm text-fg-muted">Demo account number. Transfers are not real.</p>
      </section>
      <Button size="lg" full onClick={done}>I’ve sent {formatNaira(n || 0)}</Button>
      <p className="text-center text-sm text-fg-muted">Prefer a card or USSD? <Link href="/app/help" className="font-bold underline">See how</Link></p>
    </div>
  );
}
