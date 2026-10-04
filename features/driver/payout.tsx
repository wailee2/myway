"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { Banner, Chip } from "@/components/ui/primitives";
import { digitsOnly } from "@/lib/input";
import { useAlerts } from "@/lib/store/alerts";
import { BANKS, useDriver } from "@/lib/store/driver";
import { useSession } from "@/lib/store/session";

const LEN = 10;

export function PayoutAccount() {
  const { payout, setPayout } = useDriver();
  const name = useSession((s) => s.name);
  const push = useAlerts((s) => s.push);
  const [bank, setBank] = useState(payout.bank);
  const [acct, setAcct] = useState(payout.accountNumber);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (acct.length !== LEN) return setErr(`A bank account number has ${LEN} digits. You’ve entered ${acct.length}.`);
    setPayout({ bank, accountNumber: acct, accountName: name || payout.accountName });
    push("driver", { icon: "bank", title: "Payout account updated", body: `${bank} •• ${acct.slice(-4)} will receive your withdrawals.` });
    setSaved(true);
  };
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader title="Payout account" back="/drive/profile" sub="Where your withdrawals go" />
      <div className="space-y-2.5">
        <p className="font-sans text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Bank</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Bank">{BANKS.map((b) => <Chip key={b} active={bank === b} onClick={() => { setBank(b); setSaved(false); }}>{b}</Chip>)}</div>
      </div>
      <Field label="Account number" inputMode="numeric" pattern="[0-9]*" maxLength={LEN} placeholder="10 digits" icon="bank" value={acct} onChange={(e) => { setAcct(digitsOnly(e.target.value, LEN)); setErr(""); setSaved(false); }} error={err || undefined} trailing={<span className="text-sm font-bold tabular-nums text-fg-muted">{acct.length}/{LEN}</span>} />
      <Field label="Account name" value={name || payout.accountName} readOnly icon="user" hint="Must match the name on your ID." />
      {saved && <Banner tone="success" icon="check">Saved. Withdrawals now go to {bank} •• {acct.slice(-4)}.</Banner>}
      <Button size="lg" full onClick={save}>Save account</Button>
    </div>
  );
}
