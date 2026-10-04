"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Avatar, Badge, Banner, Card, EmptyState, Row } from "@/components/ui/primitives";
import { stopName } from "@/lib/data/stops";
import { formatCountdown, formatNaira } from "@/lib/format";
import { useCountdown } from "@/lib/hooks/use-countdown";
import { useDriver } from "@/lib/store/driver";

const RIDERS = [
  { name: "Chidi Eze", seat: "Back left", code: "4821" },
  { name: "Funke Adeyemi", seat: "Back middle", code: "7305" },
  { name: "Musa Ibrahim", seat: "Front", code: "1196" },
];

export function LiveTrip() {
  const router = useRouter();
  const { activeTrip, endTrip } = useDriver();
  const left = useCountdown(372);
  const [filled, setFilled] = useState(1);
  const [boarded, setBoarded] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [started, setStarted] = useState(false);

  // Simulates riders booking in while the countdown runs.
  useEffect(() => {
    if (!activeTrip || filled >= Math.min(activeTrip.seats, 3)) return;
    const id = window.setTimeout(() => setFilled((f) => f + 1), 2600);
    return () => window.clearTimeout(id);
  }, [filled, activeTrip]);

  if (!activeTrip) return <EmptyState title="No trip posted" body="Post a trip to start filling seats." action={<ButtonLink href="/drive/post" icon="plus">Post a trip</ButtonLink>} />;
  const riders = RIDERS.slice(0, filled);

  const verify = () => {
    const r = riders.find((x) => x.code === code);
    if (!r) return setMsg({ tone: "danger", text: "That code doesn’t match a rider on this trip. Check the 4 digits and try again." });
    if (boarded.includes(r.name)) return setMsg({ tone: "danger", text: `${r.name} is already on board.` });
    setBoarded((b) => [...b, r.name]);
    setMsg({ tone: "success", text: `${r.name} verified · ${r.seat} seat` });
    setCode("");
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader title={`Your ${activeTrip.time} trip`} back="/drive" sub={`${stopName(activeTrip.fromId)} → ${stopName(activeTrip.toId)}`} />
      {!started ? (
        <Card tone="primary" className="space-y-1 py-6 text-center">
          <p className="text-caption font-extrabold uppercase tracking-[0.14em]">Leaves in</p>
          <p className="font-display text-7xl font-extrabold tracking-[-0.04em]">{formatCountdown(left)}</p>
          <p className="text-sm font-semibold text-primary-fg/80">or as soon as all {activeTrip.seats} seats are filled</p>
        </Card>
      ) : <Banner tone="success" icon="nav">Trip started. Drive safe, {boarded.length} rider{boarded.length === 1 ? "" : "s"} on board.</Banner>}

      <div className="flex justify-center gap-2.5" role="img" aria-label={`${filled} of ${activeTrip.seats} seats filled`}>
        {Array.from({ length: activeTrip.seats }, (_, i) => (
          <div key={i} className="grid gap-1.5 justify-items-center">
            <span className={`grid size-[4.5rem] place-items-center rounded-[1.25rem] border-2 ${i < filled ? "border-outline bg-primary text-primary-fg" : "border-primary bg-surface text-primary"}`}>{i < filled ? <Avatar name={RIDERS[i]!.name} size={40} tone={(i % 3) as 0 | 1 | 2} /> : <Icon name="plus" size={26} strokeWidth={2.5} />}</span>
            <span className="text-xs font-semibold text-fg-muted">{i < filled ? RIDERS[i]!.name.split(" ")[0] : "Open"}</span>
          </div>
        ))}
      </div>

      <Card className="space-y-1 p-2">
        <ul>{riders.map((r) => <li key={r.name}><Row icon="user" title={r.name} sub={r.seat} right={<Badge tone={boarded.includes(r.name) ? "success" : "warning"}>{boarded.includes(r.name) ? "Boarded" : "Booked"}</Badge>} /></li>)}</ul>
      </Card>

      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); verify(); }}>
        <label htmlFor="code" className="font-bold">Verify a rider</label>
        <div className="flex gap-2.5">
          <input id="code" inputMode="numeric" maxLength={4} value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setMsg(null); }} placeholder="4-digit code" className="h-14 min-w-0 flex-1 rounded-lg border-2 border-line bg-surface-sunken px-4 text-center font-display text-2xl font-extrabold tracking-[0.4em] outline-none focus:border-primary" />
          <Button type="submit" size="lg" disabled={code.length !== 4}>Confirm</Button>
        </div>
        <p className="text-sm text-fg-muted">Demo codes: {riders.map((r) => r.code).join(", ")}</p>
        {msg && <Banner tone={msg.tone} icon={msg.tone === "success" ? "check" : "alert"}>{msg.text}</Banner>}
      </form>

      {!started ? (
        <Button size="lg" full icon="nav" onClick={() => setStarted(true)} disabled={boarded.length === 0}>Start trip</Button>
      ) : (
        <Button size="lg" full variant="outline" onClick={() => { endTrip(); router.push("/drive/earnings"); }}>End trip · earn {formatNaira(3600)}</Button>
      )}
    </div>
  );
}
