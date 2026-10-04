"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Field, Switch } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Avatar, Row } from "@/components/ui/primitives";

const HOLD_MS = 3000;

export function Safety() {
  const [contacts, setContacts] = useState(["Mum", "Tunde"]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [auto, setAuto] = useState(true);
  const [sos, setSos] = useState(false);
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef(0);

  const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; setProgress(0); };
  const begin = () => {
    start.current = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) { raf.current = null; setSos(true); setProgress(0); return; }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  if (sos) {
    return (
      <div role="alertdialog" aria-modal="true" aria-labelledby="sos-title" className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-danger p-6 text-center text-white">
        <div className="mx-auto grid max-w-md gap-6">
          <div className="relative mx-auto grid size-52 place-items-center">
            <span className="absolute inset-0 rounded-full border-4 border-white motion-safe:animate-pulse-ring" aria-hidden="true" />
            <span className="grid size-36 place-items-center rounded-full bg-white text-danger"><Icon name="alert" size={72} strokeWidth={2.4} /></span>
          </div>
          <h1 id="sos-title" className="text-display-lg">Alert sent</h1>
          <p className="text-lg font-semibold text-white/90">{contacts.join(", ")} and the MYWAY safety team can see your live location and trip details.</p>
          <a href="tel:112" className="pressable sticker inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-white font-bold text-outline"><Icon name="phone" size={20} />Call 112</a>
          <button type="button" onClick={() => setSos(false)} className="pressable h-14 rounded-lg border-2 border-white font-bold text-white">I’m safe · cancel alert</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Safety centre" back="/app" />
      <button
        type="button"
        aria-label="Emergency SOS. Press and hold for three seconds."
        onPointerDown={begin}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) begin(); }}
        onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") stop(); }}
        className="pressable sticker-lg relative flex w-full touch-none select-none items-center gap-4 overflow-hidden rounded-2xl bg-danger p-5 text-left text-white"
      >
        <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-black/25" style={{ width: `${progress * 100}%` }} />
        <span className="relative grid size-14 shrink-0 place-items-center rounded-full bg-white text-danger"><Icon name="alert" size={30} strokeWidth={2.5} /></span>
        <span className="relative"><span className="block font-display text-2xl font-extrabold">Emergency SOS</span><span className="block text-sm font-semibold text-white/85">{progress > 0 ? "Keep holding…" : "Hold for 3 seconds during a trip"}</span></span>
      </button>

      <section aria-labelledby="tc-title" className="space-y-3">
        <h2 id="tc-title" className="font-sans text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Trusted contacts</h2>
        <ul className="flex flex-wrap items-start gap-4">
          {contacts.map((c, i) => <li key={c} className="grid justify-items-center gap-1.5"><Avatar name={c} size={56} tone={(i % 3) as 0 | 1 | 2} /><span className="text-sm font-semibold">{c}</span></li>)}
          <li className="grid justify-items-center gap-1.5">
            <button type="button" aria-label="Add trusted contact" onClick={() => setAdding((v) => !v)} className="pressable grid size-14 place-items-center rounded-full border-2 border-line-strong"><Icon name="plus" size={22} /></button>
            <span className="text-sm font-semibold">Add</span>
          </li>
        </ul>
        {adding && (
          <form className="flex items-end gap-2.5" onSubmit={(e) => { e.preventDefault(); if (newName.trim()) { setContacts((c) => [...c, newName.trim()]); setNewName(""); setAdding(false); } }}>
            <Field className="flex-1" label="Contact name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Sister" />
            <Button type="submit" size="lg">Save</Button>
          </form>
        )}
      </section>

      <ul className="divide-y divide-line rounded-xl border border-line bg-surface px-4">
        <li><Row icon="share" title="Auto-share every trip" sub={`${contacts.slice(0, 2).join(" and ")} get a live link`} right={<Switch checked={auto} onChange={setAuto} label="Auto-share every trip" />} /></li>
        <li><Row icon="badge" title="How we verify drivers" sub="ID, face match, vehicle papers" right={<Icon name="chevR" size={18} className="text-fg-disabled" />} /></li>
        <li><Row icon="flag" title="Report a problem" sub="Tell the safety team" right={<Icon name="chevR" size={18} className="text-fg-disabled" />} /></li>
        <li><a href="tel:112" className="block"><Row icon="phone" tone="danger" title="Emergency line" sub="Call 112" right={<Icon name="chevR" size={18} className="text-fg-disabled" />} /></a></li>
      </ul>
    </div>
  );
}
