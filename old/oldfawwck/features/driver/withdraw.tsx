"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Banner, Card, Chip } from "@/components/ui/primitives";
import { formatNaira } from "@/lib/format";
import { useDriver } from "@/lib/store/driver";

export function Withdraw() {
  const router = useRouter();
  const { balance, withdraw } = useDriver();
  const [amount, setAmount] = useState("20000");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const n = Number(amount) || 0;
  const submit = () => {
    if (n < 1000) return setErr("The minimum withdrawal is ₦1,000.");
    if (n > balance) return setErr(`You only have ${formatNaira(balance)} available.`);
    withdraw(n);
    setDone(true);
    window.setTimeout(() => router.push("/drive/earnings"), 1400);
  };
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader title="Withdraw" back="/drive/earnings" />
      <div className="text-center"><p className="text-sm font-semibold text-fg-muted">Available balance</p><p className="font-display text-6xl font-extrabold tracking-[-0.04em]">{formatNaira(balance)}</p></div>
      <Field label="Amount (₦)" inputMode="numeric" icon="cash" value={amount} onChange={(e) => { setAmount(e.target.value.replace(/\D/g, "")); setErr(""); }} error={err} />
      <div className="rail" role="group" aria-label="Quick amounts">{[5000, 10000, 20000].map((v) => <Chip key={v} active={n === v} onClick={() => { setAmount(String(v)); setErr(""); }}>{formatNaira(v)}</Chip>)}<Chip active={n === balance} onClick={() => setAmount(String(balance))}>All</Chip></div>
      <Card className="flex items-center gap-3.5"><span className="grid size-11 place-items-center rounded-[0.875rem] bg-surface-sunken text-primary"><Icon name="bank" size={22} /></span><div className="flex-1"><p className="font-bold">GTBank •• 4021</p><p className="text-sm text-fg-muted">Ade Okafor (demo account)</p></div></Card>
      <p className="flex items-center gap-2 rounded-lg bg-surface-sunken p-3 text-sm text-fg-muted"><Icon name="clock" size={16} className="text-primary" />Instant · free once a day · ₦50 after</p>
      {done && <Banner tone="success" icon="check">{formatNaira(n)} is on its way to your bank.</Banner>}
      <Button size="lg" full onClick={submit} disabled={done}>Withdraw {formatNaira(n)}</Button>
    </div>
  );
}
