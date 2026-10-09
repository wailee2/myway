"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Field, Switch, useDialog } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Avatar, Banner, Row } from "@/components/ui/primitives";
import { track } from "@/lib/analytics";
import { DEMO } from "@/lib/demo";
import { formatPhone, nationalPhone, phoneInput } from "@/lib/input";
import { formatTime, timeAgoLabel } from "@/lib/format";
import { getDriver, getTrip } from "@/lib/data/trips";
import { isActiveTrip, useBooking } from "@/lib/store/booking";
import { useSafety } from "@/lib/store/safety";
import { ReportSheet } from "./report-sheet";

const HOLD_MS = 3000;

export function Safety() {
  const { contacts, autoShare, reports, addContact, removeContact, setAutoShare } = useSafety();
  const active = useBooking((s) => s.bookings.find(isActiveTrip));
  const report = useDialog();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState<{ name?: string; phone?: string }>({});
  const [sos, setSos] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shared, setShared] = useState(false);
  const raf = useRef<number | null>(null);
  const start = useRef(0);

  const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; setProgress(0); };
  const begin = () => {
    start.current = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) { raf.current = null; setSos(true); setProgress(0); track("sos"); return; }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  const saveContact = () => {
    const e: typeof err = {};
    if (name.trim().length < 2) e.name = "Enter a name.";
    const p = nationalPhone(phone);
    if (!p) e.phone = "Enter a valid Nigerian mobile number, e.g. 8031234567.";
    setErr(e);
    if (e.name || e.phone) return;
    addContact({ name: name.trim(), phone: p! });
    setName(""); setPhone(""); setAdding(false);
  };

  const shareTrip = async () => {
    if (!active) return;
    const trip = getTrip(active.tripId ?? "");
    const d = trip ? getDriver(trip.driverId) : undefined;
    const text = `I’m on a MYWAY ride: ${active.title}, leaving ${formatTime(active.time)}.${d ? ` ${d.color} ${d.make}, plate ${d.plate}.` : ""}`;
    try {
      if (navigator.share) await navigator.share({ title: "My MYWAY trip", text });
      else { await navigator.clipboard.writeText(text); setShared(true); window.setTimeout(() => setShared(false), 1800); }
    } catch { /* dismissed */ }
  };

  if (sos) {
    return (
      <div role="alertdialog" aria-modal="true" aria-labelledby="sos-title" className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-danger-solid p-6 text-center text-white">
        <div className="mx-auto grid max-w-md gap-6">
          <div className="relative mx-auto grid size-52 place-items-center">
            <span className="absolute inset-0 rounded-full border-4 border-white motion-safe:animate-pulse-ring" aria-hidden="true" />
            <span className="grid size-36 place-items-center rounded-full bg-white text-danger-solid"><Icon name="alert" size={72} strokeWidth={2.4} /></span>
          </div>
          <h1 id="sos-title" className="text-display-lg">Alert sent</h1>
          <p className="text-lg font-semibold">{contacts.length ? `${contacts.map((c) => c.name).join(", ")} and the MYWAY safety team can see your live location and trip details.` : "The MYWAY safety team can see your live location and trip details."}</p>
          {DEMO && <p className="rounded-lg bg-black/25 p-3 font-semibold">Demo: no alert was actually sent. Real SOS needs the backend and a monitored support desk.</p>}
          <a href="tel:112" className="pressable sticker inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-white font-bold text-outline"><Icon name="phone" size={20} />Call 112</a>
          <button type="button" onClick={() => setSos(false)} className="pressable h-14 rounded-lg border-2 border-white font-bold text-white">I’m safe · cancel alert</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Safety" back="/app" />
      <button
        type="button"
        aria-label="Emergency SOS. Press and hold for three seconds."
        onPointerDown={begin}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) begin(); }}
        onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") stop(); }}
        className="pressable sticker-lg relative flex w-full touch-none select-none items-center gap-4 overflow-hidden rounded-2xl bg-danger-solid p-5 text-left text-white"
      >
        <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-black/30" style={{ width: `${progress * 100}%` }} />
        <span className="relative grid size-14 shrink-0 place-items-center rounded-full bg-white text-danger-solid"><Icon name="alert" size={30} strokeWidth={2.5} /></span>
        <span className="relative"><span className="block font-display text-2xl font-extrabold">Emergency SOS</span><span className="block text-sm font-semibold">{progress > 0 ? "Keep holding…" : "Hold for 3 seconds during a trip"}</span></span>
      </button>

      {active && (
        <Button variant="outline" size="lg" full icon="share" onClick={shareTrip}>{shared ? "Copied to clipboard" : "Share my live trip"}</Button>
      )}

      <section aria-labelledby="tc-title" className="space-y-3">
        <h2 id="tc-title" className="font-sans text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Trusted contacts</h2>
        {contacts.length === 0 && <p className="text-fg-secondary">Add someone who should know when you travel. Save their phone number so they can be reached.</p>}
        <ul className="grid gap-1">
          {contacts.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3.5 py-1.5">
              <Avatar name={c.name} size={48} tone={(i % 3) as 0 | 1 | 2} />
              <span className="min-w-0 flex-1"><span className="block font-bold">{c.name}</span><span className="block text-sm text-fg-muted">{formatPhone(c.phone)}</span></span>
              <button type="button" onClick={() => removeContact(c.id)} aria-label={`Remove ${c.name}`} className="pressable grid size-11 place-items-center rounded-full text-fg-muted hover:bg-surface-sunken"><Icon name="x" size={18} /></button>
            </li>
          ))}
        </ul>
        {adding ? (
          <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); saveContact(); }}>
            <Field label="Contact name" autoComplete="off" value={name} onChange={(e) => { setName(e.target.value); setErr({}); }} placeholder="e.g. Sister" error={err.name} icon="user" />
            <Field label="Phone number" type="tel" inputMode="numeric" value={phone} onChange={(e) => { setPhone(phoneInput(e.target.value)); setErr({}); }} placeholder="8031234567" error={err.phone} icon="phone" trailing={<span className="text-sm font-bold text-fg-muted">+234</span>} />
            <div className="grid grid-cols-2 gap-2.5"><Button type="button" variant="ghost" onClick={() => { setAdding(false); setErr({}); }}>Cancel</Button><Button type="submit">Save contact</Button></div>
          </form>
        ) : (
          <Button variant="outline" icon="plus" onClick={() => setAdding(true)}>Add a trusted contact</Button>
        )}
      </section>

      <ul className="divide-y divide-line rounded-xl border border-line bg-surface px-4">
        <li><Row icon="share" title="Auto-share every trip" sub={contacts.length ? `${contacts.slice(0, 2).map((c) => c.name).join(" and ")} get a live link` : "Add a contact first"} right={<Switch checked={autoShare && contacts.length > 0} onChange={setAutoShare} label="Auto-share every trip" />} /></li>
        <li><Link href="/app/help" className="block"><Row icon="badge" title="How we verify drivers" sub="ID, face match, vehicle papers" right={<Icon name="chevR" size={18} className="text-fg-disabled" />} /></Link></li>
        <li><button type="button" onClick={report.open} className="block w-full text-left"><Row icon="flag" title="Report a problem" sub="Goes to the MYWAY support team" right={<Icon name="chevR" size={18} className="text-fg-disabled" />} /></button></li>
        <li><a href="tel:112" className="block"><Row icon="phone" tone="danger" title="Emergency line" sub="Call 112" right={<Icon name="chevR" size={18} className="text-fg-disabled" />} /></a></li>
      </ul>

      {reports.length > 0 && (
        <section aria-labelledby="rp-title" className="space-y-2">
          <h2 id="rp-title" className="font-sans text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Your reports</h2>
          <ul className="grid gap-2">{reports.slice(0, 5).map((r) => <li key={r.id}><Banner tone="info" icon="doc"><p className="font-extrabold">{r.ref} · {r.category}</p><p>Received at {timeAgoLabel(r.at)}. Support will contact you.</p></Banner></li>)}</ul>
        </section>
      )}
      <Banner tone="info" icon="lock">{DEMO ? "Demo: contacts and reports are saved on this phone only." : "Your contacts are only used to share your trips."}</Banner>
      <ReportSheet dialogRef={report.ref} bookingId={active?.id} />
    </div>
  );
}
