"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog, useDialog } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Avatar, Badge, Banner, Card, EmptyState, Row } from "@/components/ui/primitives";
import { DEMO, DEMO_DRIVER_RIDERS } from "@/lib/demo";
import { stopName } from "@/lib/data/stops";
import { formatNaira, formatTime } from "@/lib/format";
import { useDemoRiders } from "@/lib/hooks/use-demo-riders";
import { COPY, POLICY } from "@/lib/policy";
import { useAlerts } from "@/lib/store/alerts";
import { useDriver } from "@/lib/store/driver";

export function LiveTrip() {
  const router = useRouter();
  const { activeTrip, riders, started, board, markNoShow, startTrip, endTrip } = useDriver();
  const push = useAlerts((s) => s.push);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [absent, setAbsent] = useState<string | null>(null);
  const dlg = useDialog();
  useDemoRiders();

  if (!activeTrip) return <EmptyState title="No trip posted" body="Post a trip to start filling seats." action={<ButtonLink href="/drive/post" icon="plus">Post a trip</ButtonLink>} />;
  const active = riders.filter((r) => !r.noShow);
  const boarded = riders.filter((r) => r.boarded);

  const verify = () => {
    const r = board(code);
    setMsg(r.ok ? { tone: "success", text: `${r.name} verified · ${r.seat}` } : { tone: "danger", text: r.message });
    if (r.ok) setCode("");
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader title={`Your ${formatTime(activeTrip.time)} trip`} back="/drive" sub={`${stopName(activeTrip.fromId)} → ${stopName(activeTrip.toId)}`} />
      {!started ? (
        <Card tone="primary" className="space-y-1 py-6 text-center">
          <p className="text-caption font-extrabold uppercase tracking-[0.14em]">Leaves at</p>
          <p className="font-display text-6xl font-extrabold tracking-[-0.04em]">{formatTime(activeTrip.time)}</p>
          <p className="text-sm font-semibold">{riders.length} of {activeTrip.seats} seats booked</p>
        </Card>
      ) : <Banner tone="success" icon="nav">Trip started. Drive safe, {boarded.length} rider{boarded.length === 1 ? "" : "s"} on board.</Banner>}

      <div className="flex justify-center gap-2.5" role="img" aria-label={`${riders.length} of ${activeTrip.seats} seats booked`}>
        {Array.from({ length: activeTrip.seats }, (_, i) => (
          <div key={i} className="grid justify-items-center gap-1.5">
            <span className={`grid size-[4.5rem] place-items-center rounded-[1.25rem] border-2 ${riders[i] ? "border-outline bg-primary text-primary-fg" : "border-primary bg-surface text-primary"}`}>{riders[i] ? <Avatar name={riders[i]!.name} size={40} tone={(i % 3) as 0 | 1 | 2} /> : <Icon name="plus" size={26} strokeWidth={2.5} />}</span>
            <span className="text-xs font-semibold text-fg-muted">{riders[i] ? riders[i]!.name.split(" ")[0] : "Open"}</span>
          </div>
        ))}
      </div>

      {riders.length === 0 ? <p className="text-center text-fg-muted">No bookings yet. Riders going your way can book until you leave.</p> : (
        <Card className="space-y-1 p-2">
          <ul>{riders.map((r) => (
            <li key={r.name}>
              <Row icon="user" title={r.name} sub={r.noShow ? "No-show" : r.seat} right={
                r.boarded ? <Badge tone="success">Boarded</Badge> : r.noShow ? <Badge tone="danger">No-show</Badge> : !started ? <button type="button" onClick={() => { setAbsent(r.name); dlg.open(); }} className="pressable min-h-11 rounded-lg border-2 border-line-strong px-3 text-sm font-bold">Didn’t show</button> : <Badge tone="warning">Booked</Badge>
              } />
            </li>
          ))}</ul>
        </Card>
      )}

      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); verify(); }}>
        <label htmlFor="code" className="font-bold">Verify a rider</label>
        <div className="flex gap-2.5">
          <input id="code" inputMode="numeric" maxLength={4} value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setMsg(null); }} placeholder="4-digit code" className="h-14 min-w-0 flex-1 rounded-lg border-2 border-line bg-surface-sunken px-4 text-center font-display text-2xl font-extrabold tracking-[0.4em] outline-none focus:border-primary" />
          <Button type="submit" size="lg" disabled={code.length !== 4}>Confirm</Button>
        </div>
        {DEMO && <p className="text-sm text-fg-muted">Demo codes: {active.map((r) => r.code).join(", ") || DEMO_DRIVER_RIDERS[0]!.code}</p>}
        {msg && <Banner tone={msg.tone} icon={msg.tone === "success" ? "check" : "alert"}>{msg.text}</Banner>}
      </form>

      {!started ? (
        <Button size="lg" full icon="nav" onClick={startTrip} disabled={boarded.length === 0}>Start trip</Button>
      ) : (
        <Button size="lg" full variant="outline" onClick={() => { const earned = endTrip(); push("driver", { icon: "wallet", title: "Trip complete", body: `${formatNaira(earned)} added to your balance.` }); router.push("/drive/earnings"); }}>End trip</Button>
      )}

      <Dialog dialogRef={dlg.ref} title={`${absent ?? "Rider"} didn’t show?`}>
        <p className="mb-2 text-fg-secondary">{COPY.noShow}</p>
        <p className="mb-5 text-sm text-fg-muted">Only mark a no-show after waiting at least {POLICY.noShowWaitMinutes} minutes. You’re still paid for seats that were booked and prepaid.</p>
        <div className="grid gap-2.5">
          <Button full variant="danger" onClick={() => { if (absent) markNoShow(absent); dlg.close(); }}>Mark as no-show</Button>
          <Button full variant="ghost" onClick={dlg.close}>Keep waiting</Button>
        </div>
      </Dialog>
    </div>
  );
}
