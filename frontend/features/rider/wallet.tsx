"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DemoPanel } from "@/components/ui/demo-panel";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Banner, Chip, Eyebrow, Row } from "@/components/ui/primitives";
import { DEMO } from "@/lib/demo";
import { ApiError } from "@/lib/api/client";
import { formatNaira, signedNaira } from "@/lib/format";
import { useBooking } from "@/lib/store/booking";
import { useSession } from "@/lib/store/session";
import { cn } from "@/lib/cn";

export function Wallet() {
  const { balance, transactions, pendingTopUps, confirmTopUp, cancelTopUp } = useBooking();
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

      {pendingTopUps.length > 0 && (
        <section aria-label="Pending top-ups" className="space-y-2">
          {pendingTopUps.map((p) => (
            <Banner key={p.id} tone="warning" icon="clock">
              <p className="font-extrabold">{formatNaira(p.amount)} pending</p>
              <p>Waiting for your bank to confirm the transfer. Your balance updates as soon as it arrives.</p>
              <div className="mt-1 flex flex-wrap gap-x-4">
                <button type="button" onClick={() => cancelTopUp(p.id)} className="min-h-11 font-extrabold underline underline-offset-4">Cancel</button>
                {DEMO && <button type="button" onClick={() => confirmTopUp(p.id)} className="min-h-11 font-extrabold underline underline-offset-4">Demo: simulate bank confirmation</button>}
              </div>
            </Banner>
          ))}
        </section>
      )}

      <section aria-labelledby="act-title">
        <h2 id="act-title" className="mb-1 font-sans text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Recent activity</h2>
        {transactions.length ? (
          <ul className="divide-y divide-line">
            {transactions.slice(0, 12).map((t) => (
              <li key={t.id}><Row icon={t.icon} title={t.title} sub={t.sub} tone={t.amount > 0 ? "success" : "neutral"} right={<span className={cn("font-display text-lg font-extrabold", t.amount > 0 && "text-success-text")}>{signedNaira(t.amount)}</span>} /></li>
            ))}
          </ul>
        ) : <p className="py-4 text-fg-muted">No activity yet. Top up or book a ride and it will show here.</p>}
      </section>
    </div>
  );
}

export function TopUp({ initialAmount, returnTo }: { initialAmount: number; returnTo: string }) {
  const router = useRouter();
  const name = useSession((s) => s.name);
  const phone = useSession((s) => s.phone);
  const requestTopUp = useBooking((s) => s.requestTopUp);
  const [amount, setAmount] = useState(String(initialAmount));
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");
  const n = Number(amount.replace(/\D/g, ""));
  // Demo virtual account: derived from the signed-in number. A real one comes from the payment provider.
  const account = `9${(phone || "0000000000").padStart(10, "0").slice(-9)}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(account); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { /* clipboard blocked */ }
  };
  const [saving, setSaving] = useState(false);
  const done = async () => {
    if (n < 100) return setErr("The minimum top-up is ₦100.");
    setSaving(true);
    try {
      await requestTopUp(n); // PENDING until the bank confirms. We never credit on the rider's say-so.
      router.push(returnTo === "/app/wallet" ? "/app/wallet" : returnTo);
    } catch (e) {
      setSaving(false);
      setErr(e instanceof ApiError ? e.message : "Something went wrong. Try again.");
    }
  };
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Top up wallet" back="/app/wallet" />
      <Field label="Amount (₦)" inputMode="numeric" value={amount} onChange={(e) => { setAmount(e.target.value.replace(/\D/g, "")); setErr(""); }} error={err} icon="wallet" />
      <div className="rail" role="group" aria-label="Quick amounts">{[1000, 2000, 5000, 10000].map((v) => <Chip key={v} active={n === v} onClick={() => { setAmount(String(v)); setErr(""); }}>{formatNaira(v)}</Chip>)}</div>
      <section className="space-y-3 rounded-xl border-2 border-outline bg-primary-soft p-5" aria-labelledby="bt-title">
        <h2 id="bt-title" className="flex items-center gap-2.5 font-sans text-base font-bold"><Icon name="bank" size={20} />Bank transfer · instant</h2>
        <div className="flex items-center justify-between gap-3 rounded-lg bg-surface p-4">
          <div><p className="text-sm text-fg-muted">Account name: MYWAY · {name || "Rider"}</p><p className="font-display text-3xl font-extrabold tracking-[0.04em]">{account.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")}</p></div>
          <button type="button" onClick={copy} aria-label="Copy account number" className="pressable grid size-12 place-items-center rounded-full bg-surface-sunken"><Icon name={copied ? "check" : "copy"} size={20} /></button>
        </div>
        <p className="text-sm text-fg-secondary">Send exactly {formatNaira(n || 0)} from your bank app. Your balance updates when the bank confirms, usually within a minute.{DEMO && " (Demo account number: transfers are not real.)"}</p>
      </section>
      <Button size="lg" full onClick={done} disabled={saving}>{saving ? "Saving…" : "I’ve sent the transfer"}</Button>
      <DemoPanel title="Demo"><p className="text-sm text-fg-muted">After this, the top-up shows as pending on the wallet. Use “simulate bank confirmation” there to credit it.</p></DemoPanel>
      <p className="text-center text-sm text-fg-muted">Prefer a card or USSD? <Link href="/app/help" className="font-bold underline">See how</Link></p>
    </div>
  );
}
