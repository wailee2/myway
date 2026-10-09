"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Banner, Card, Chip } from "@/components/ui/primitives";
import { formatNaira } from "@/lib/format";
import Link from "next/link";
import { useAlerts } from "@/lib/store/alerts";
import { useDriver } from "@/lib/store/driver";
import { POLICY } from "@/lib/policy";

export function Withdraw() {
  const router = useRouter();
  const { balance, withdraw, payout } = useDriver();
  const push = useAlerts((s) => s.push);
  const [amount, setAmount] = useState("20000");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const n = Number(amount) || 0;
  const submit = () => {
    if (n < POLICY.minWithdrawal) return setErr(`The minimum withdrawal is ${formatNaira(POLICY.minWithdrawal)}.`);
    if (n > balance) return setErr(`You only have ${formatNaira(balance)} available.`);
    withdraw(n);
    push("driver", { icon: "bank", title: `Withdrawal of ${formatNaira(n)} sent`, body: `${payout.bank} •• ${payout.accountNumber.slice(-4)}. Instant transfer.` });
    setDone(true);
    window.setTimeout(() => router.push("/drive/earnings"), 1400);
  };
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader title="Withdraw" back="/drive/earnings" />
      <div className="text-center"><p className="text-sm font-semibold text-fg-muted">Available balance</p><p className="font-display text-6xl font-extrabold tracking-[-0.04em]">{formatNaira(balance)}</p></div>
      <Field label="Amount (₦)" inputMode="numeric" icon="cash" value={amount} onChange={(e) => { setAmount(e.target.value.replace(/\D/g, "")); setErr(""); }} error={err} />
      <div className="rail" role="group" aria-label="Quick amounts">{[5000, 10000, 20000].map((v) => <Chip key={v} active={n === v} onClick={() => { setAmount(String(v)); setErr(""); }}>{formatNaira(v)}</Chip>)}<Chip active={n === balance} onClick={() => setAmount(String(balance))}>All</Chip></div>
      <Card className="flex items-center gap-3.5"><span className="grid size-11 place-items-center rounded-[0.875rem] bg-surface-sunken text-primary"><Icon name="bank" size={22} /></span><div className="flex-1"><p className="font-bold">{payout.bank} •• {payout.accountNumber.slice(-4)}</p><p className="text-sm text-fg-muted">{payout.accountName}</p></div><Link href="/drive/payout" className="rounded-md px-2 py-1 text-sm font-bold text-primary hover:bg-surface-sunken">Change</Link></Card>
      <p className="flex items-center gap-2 rounded-lg bg-surface-sunken p-3 text-sm text-fg-muted"><Icon name="clock" size={16} className="text-primary" />Instant · free once a day · {formatNaira(POLICY.extraWithdrawalFee)} after</p>
      {done && <Banner tone="success" icon="check">{formatNaira(n)} is on its way to your bank.</Banner>}
      <Button size="lg" full onClick={submit} disabled={done}>Withdraw {formatNaira(n)}</Button>
    </div>
  );
}
