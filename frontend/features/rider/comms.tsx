"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, Switch } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/primitives";
import { DemoPanel } from "@/components/ui/demo-panel";
import { DEMO } from "@/lib/demo";
import { LIVE } from "@/lib/api/live";
import { formatCountdown, timeAgoLabel } from "@/lib/format";
import { COPY, POLICY } from "@/lib/policy";
import { useBooking } from "@/lib/store/booking";
import { cn } from "@/lib/cn";

/* ---------------- Tier 1: quick messages ---------------- */
const QUICK = ["I’m at the pickup", "I’m 2 min away", "I can’t find you", "Where are you?"];
const REPLY: Record<string, string> = {
  "I’m at the pickup": "Great, I can see the stop. Coming now.",
  "I’m 2 min away": "Okay, I’ll wait for you.",
  "I can’t find you": "I’m by the stop in the car. Look for the plate on your screen.",
  "Where are you?": "Almost at the stop, about 2 minutes.",
};

export function QuickMessages({ bookingId, driverName }: { bookingId: string; driverName: string }) {
  const messages = useBooking((s) => s.messages.filter((m) => m.bookingId === bookingId));
  const send = useBooking((s) => s.sendMessage);
  const load = useBooking((s) => s.loadMessages);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  // With the backend on, the real conversation is fetched, and checked again every few seconds for the driver's replies.
  useEffect(() => {
    if (!LIVE) return;
    void load(bookingId);
    const id = window.setInterval(() => void load(bookingId), 8000);
    return () => window.clearInterval(id);
  }, [bookingId, load]);

  const tap = (text: string) => {
    send(bookingId, text, "rider");
    // Demo only: a real driver reply arrives from the backend.
    if (DEMO && !LIVE) timers.current.push(window.setTimeout(() => send(bookingId, REPLY[text] ?? "Okay.", "driver"), 1600));
  };

  return (
    <section aria-labelledby="qm-title" className="space-y-3">
      <h2 id="qm-title" className="font-sans text-base font-bold">Message {driverName.split(" ")[0]}</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {QUICK.map((q) => <button key={q} type="button" onClick={() => tap(q)} className="pressable min-h-12 rounded-lg border-2 border-line-strong bg-surface px-3 py-2 text-sm font-bold hover:bg-surface-sunken">{q}</button>)}
      </div>
      {messages.length > 0 && (
        <ul className="space-y-1.5" aria-live="polite" aria-label="Messages">
          {messages.slice(-4).map((m) => (
            <li key={m.id} className={cn("max-w-[85%] rounded-2xl px-3.5 py-2 text-sm font-semibold", m.from === "rider" ? "ml-auto bg-secondary text-secondary-fg" : "bg-surface-sunken")}>
              {m.text}<span className="ml-2 text-[0.6875rem] font-medium opacity-70">{timeAgoLabel(m.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------------- Tier 2: masked call (mock) ---------------- */
type Phase = "ringing" | "connected" | "no_answer" | "ended";

export function CallSheet({ dialogRef, driverName, bookingId }: { dialogRef: React.RefObject<HTMLDialogElement | null>; driverName: string; bookingId: string }) {
  const [phase, setPhase] = useState<Phase>("ringing");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [noAnswer, setNoAnswer] = useState(false);
  const send = useBooking((s) => s.sendMessage);
  const first = driverName.split(" ")[0];

  // Dialing starts when the sheet opens (the dialog's content is mounted but hidden until then).
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const obs = new MutationObserver(() => {
      if (dlg.open) { setPhase("ringing"); setSeconds(0); setMuted(false); setSpeaker(false); }
    });
    obs.observe(dlg, { attributes: true, attributeFilter: ["open"] });
    return () => obs.disconnect();
  }, [dialogRef]);

  // Ringing → connected or no answer. No telephony provider is attached yet: outside demo mode a call always ends as "no answer".
  useEffect(() => {
    if (phase !== "ringing") return;
    const id = window.setTimeout(() => setPhase(DEMO && !noAnswer ? "connected" : "no_answer"), DEMO ? 2400 : 6000);
    return () => window.clearTimeout(id);
  }, [phase, noAnswer]);

  useEffect(() => {
    if (phase !== "connected") return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const limit = POLICY.callLimitMinutes * 60;
  useEffect(() => { if (phase === "connected" && seconds >= limit) setPhase("ended"); }, [phase, seconds, limit]);

  const end = () => { setPhase("ended"); dialogRef.current?.close(); };

  return (
    <Dialog dialogRef={dialogRef} title={phase === "no_answer" ? `${first} didn’t answer` : phase === "ended" ? "Call ended" : `Calling ${first}`}>
      <div className="grid justify-items-center gap-4 text-center" aria-live="polite">
        <Avatar name={driverName} size={88} />
        <p className="font-display text-3xl font-extrabold">{driverName}</p>
        <p className="font-semibold text-fg-secondary">
          {phase === "ringing" && "Ringing…"}
          {phase === "connected" && `Connected · ${formatCountdown(seconds)} of ${POLICY.callLimitMinutes}:00`}
          {phase === "no_answer" && "They may be driving. Try one of these instead."}
          {phase === "ended" && "Time limit reached or call finished."}
        </p>
        <p className="flex items-center gap-2 rounded-full bg-success-soft px-3.5 py-1.5 text-sm font-bold text-success-text"><Icon name="lock" size={14} />Your number stays private</p>

        {(phase === "ringing" || phase === "connected") && (
          <div className="grid w-full grid-cols-3 gap-3">
            <button type="button" aria-pressed={muted} onClick={() => setMuted((v) => !v)} className={cn("pressable min-h-16 rounded-xl border-2 font-bold", muted ? "border-outline bg-primary text-primary-fg" : "border-line-strong")}>{muted ? "Muted" : "Mute"}</button>
            <button type="button" aria-pressed={speaker} onClick={() => setSpeaker((v) => !v)} className={cn("pressable min-h-16 rounded-xl border-2 font-bold", speaker ? "border-outline bg-primary text-primary-fg" : "border-line-strong")}>Speaker</button>
            <button type="button" onClick={end} className="pressable min-h-16 rounded-xl bg-danger-solid font-bold text-white">End</button>
          </div>
        )}

        {(phase === "no_answer" || phase === "ended") && (
          <div className="grid w-full gap-2.5">
            <Button size="lg" full icon="chat" onClick={() => { send(bookingId, "Where are you?", "rider"); dialogRef.current?.close(); }}>Send “Where are you?”</Button>
            <Link href="/app/help" className="pressable inline-flex h-14 w-full items-center justify-center gap-2 rounded-lg border-2 border-line-strong font-bold">Contact MYWAY support</Link>
            <Button size="lg" full variant="ghost" onClick={() => dialogRef.current?.close()}>Close</Button>
          </div>
        )}
        <p className="text-sm text-fg-muted">{COPY.calls}</p>
        <DemoPanel title="Demo"><div className="flex items-center gap-3"><Switch checked={noAnswer} onChange={setNoAnswer} label="Driver doesn’t answer" /><span className="text-sm font-semibold">Driver doesn’t answer (applies to the next call)</span></div></DemoPanel>
      </div>
    </Dialog>
  );
}
