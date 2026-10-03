"use client";

import { useState } from "react";
import { Segmented } from "@/components/ui/form";
import { Icon, type IconName } from "@/components/ui/icon";
import { SeatsArt, PayArt } from "@/components/illustrations/vehicles";
import { ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/primitives";

type Tab = "riders" | "drivers";
const STEPS: Record<Tab, { icon: IconName; title: string; body: string }[]> = {
  riders: [
    { icon: "pin", title: "Pick your stop", body: "Choose a landmark like Nyanya Bridge or AYA Roundabout, then see every car and bus on that route." },
    { icon: "ticket", title: "Book a seat", body: "Choose front or back, see the price, and pay by wallet, transfer, card or cash." },
    { icon: "qr", title: "Show your code", body: "Meet your driver at the stop. Share your 4-digit code or QR and ride. The car leaves full or on time." },
  ],
  drivers: [
    { icon: "route", title: "Post your trip", body: "Set your route, time, seats and price in about 30 seconds. Repeat it every weekday." },
    { icon: "users", title: "Watch seats fill", body: "Riders book before you leave. You never stop on the road to look for passengers." },
    { icon: "wallet", title: "Verify and get paid", body: "Check each rider’s code, drive, and withdraw your earnings the same day." },
  ],
};

export function HowItWorks() {
  const [tab, setTab] = useState<Tab>("riders");
  const steps = STEPS[tab];
  return (
    <section id="how" aria-labelledby="how-title" className="mx-auto max-w-7xl scroll-mt-20 px-[var(--page-gutter)] py-20 lg:py-28">
      <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="space-y-3">
          <Eyebrow>How it works</Eyebrow>
          <h2 id="how-title" className="text-display-lg">Three steps.<br />No shouting.</h2>
        </div>
        <Segmented label="Choose who you are" value={tab} onChange={setTab} options={[{ value: "riders", label: "I’m a rider", icon: "user" }, { value: "drivers", label: "I’m a driver", icon: "car" }]} />
      </div>
      <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
        <ol key={tab} className="stagger grid gap-4">
          {steps.map((s, i) => (
            <li key={s.title} style={{ "--i": i } as React.CSSProperties} className="flex items-start gap-5 rounded-xl border border-line bg-surface p-5 sm:p-6">
              <span className="grid size-14 shrink-0 place-items-center rounded-[1rem] bg-primary text-primary-fg sticker"><Icon name={s.icon} size={26} /></span>
              <div>
                <p className="text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Step {i + 1}</p>
                <h3 className="mb-1 text-title">{s.title}</h3>
                <p className="text-fg-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="hidden rounded-2xl bg-primary-soft p-8 lg:block" aria-hidden="true">
          {tab === "riders" ? <SeatsArt className="mx-auto w-56" /> : <PayArt className="mx-auto w-72" />}
        </div>
      </div>
      <div className="mt-10">
        {tab === "riders" ? <ButtonLink href="/app" size="lg" iconRight="arrowR">Book your first seat</ButtonLink> : <ButtonLink href="/drive/post" size="lg" iconRight="arrowR">Post your first trip</ButtonLink>}
      </div>
    </section>
  );
}
