import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Badge, Eyebrow, SeatDots } from "@/components/ui/primitives";
import { Danfo, CarArt, ShieldArt } from "@/components/illustrations/vehicles";
import { StripeBand } from "@/components/illustrations/brand";

const li = (i: number) => ({ "--i": i }) as React.CSSProperties;

/* ---------- Before / after ---------- */
export function BeforeAfter() {
  const before = ["Seven people in a five-seat car", "The driver stops mid-road for one more", "Price set on the spot", "No record of who drove you"];
  const after = ["Four seats, never more", "Leaves full or on time", "Price shown before you book", "Verified driver and plate number"];
  return (
    <section aria-labelledby="ba-title" className="mx-auto max-w-7xl px-[var(--page-gutter)] py-20 lg:py-28">
      <Eyebrow className="mb-3">The problem</Eyebrow>
      <h2 id="ba-title" className="mb-10 max-w-3xl text-display-lg">Three in front. Four in back. Still stopping for more.</h2>
      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-line bg-surface-sunken p-6 sm:p-8">
          <Badge tone="danger" icon="x">The “along” today</Badge>
          <div className="my-6 flex flex-wrap gap-2" role="img" aria-label="Seven passengers in one car">
            {Array.from({ length: 7 }, (_, i) => <span key={i} className="grid size-11 place-items-center rounded-full bg-danger-soft text-danger-text"><Icon name="user" size={22} /></span>)}
          </div>
          <ul className="space-y-3">{before.map((t) => <li key={t} className="flex items-center gap-3 font-semibold text-fg-secondary"><Icon name="x" size={18} strokeWidth={3} className="shrink-0 text-danger-text" />{t}</li>)}</ul>
        </article>
        <article className="sticker rounded-2xl bg-primary p-6 text-primary-fg sm:p-8">
          <Badge tone="ink" icon="check">With MYWAY</Badge>
          <div className="my-6 flex flex-wrap items-center gap-3" role="img" aria-label="Four booked seats">
            <SeatDots taken={4} />
            <span className="font-bold">4 booked seats, one driver, on time</span>
          </div>
          <ul className="space-y-3">{after.map((t) => <li key={t} className="flex items-center gap-3 font-bold"><Icon name="check" size={18} strokeWidth={3.2} className="shrink-0" />{t}</li>)}</ul>
        </article>
      </div>
    </section>
  );
}

/* ---------- Products ---------- */
export function Products() {
  return (
    <section id="products" aria-labelledby="prod-title" className="scroll-mt-20 bg-surface-sunken py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-[var(--page-gutter)]">
        <Eyebrow className="mb-3">Two ways to ride</Eyebrow>
        <h2 id="prod-title" className="mb-10 text-display-lg">One app. Car or bus.</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="sticker flex flex-col gap-6 rounded-2xl bg-surface p-6 sm:p-8">
            <CarArt className="w-full max-w-sm" />
            <div className="space-y-2"><h3 className="text-display-md">MYWAY Ride</h3><p className="text-fg-muted">Shared cars with four seats maximum. They leave when full or at the time on the card.</p></div>
            <ul className="space-y-2.5 font-semibold">{["Pick front or back seat", "Women-only cars available", "Drivers earn on trips they already make"].map((t) => <li key={t} className="flex gap-3"><Icon name="check" size={20} strokeWidth={3} className="mt-0.5 shrink-0 text-accent-text" />{t}</li>)}</ul>
            <ButtonLink href="/app" iconRight="arrowR" className="mt-auto self-start">Book a car</ButtonLink>
          </article>
          <article className="sticker flex flex-col gap-6 rounded-2xl bg-secondary p-6 text-secondary-fg sm:p-8">
            <Danfo className="w-full max-w-sm" />
            <div className="space-y-2"><h3 className="text-display-md">MYWAY Bus</h3><p className="text-secondary-fg/70">Scheduled corridors with a fixed timetable, a seat map and a QR ticket.</p></div>
            <ul className="space-y-2.5 font-semibold">{["Live bus tracking", "Weekly and monthly passes", "Employer accounts for teams"].map((t) => <li key={t} className="flex gap-3"><Icon name="check" size={20} strokeWidth={3} className="mt-0.5 shrink-0 text-primary" />{t}</li>)}</ul>
            <ButtonLink href="/app/bus" iconRight="arrowR" className="mt-auto self-start">See bus lines</ButtonLink>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ---------- Preview (phone) ---------- */
export function Preview() {
  return (
    <section aria-labelledby="prev-title" className="mx-auto grid max-w-7xl items-center gap-12 px-[var(--page-gutter)] py-20 lg:grid-cols-2 lg:py-28">
      <div className="space-y-5">
        <Eyebrow>The details</Eyebrow>
        <h2 id="prev-title" className="text-display-lg">Everything you need to know before you leave home.</h2>
        <ul className="space-y-4">
          {([["badge", "Your driver, rated and ID-verified", "Name, photo, plate number and trip count are on the card."], ["clock", "A departure rule you can trust", "“Leaves 7:10 or when full” means exactly that."], ["fuel", "A fair, visible fare", "Fare, booking fee and fuel adjustment, itemised."]] as [IconName, string, string][]).map(([ic, t, b]) => (
            <li key={t} className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-[0.875rem] bg-primary text-primary-fg"><Icon name={ic} size={22} /></span><div><h3 className="font-sans text-lg font-bold">{t}</h3><p className="text-fg-muted">{b}</p></div></li>
          ))}
        </ul>
      </div>
      <div className="relative mx-auto w-[19rem]" aria-label="Preview of the booking screen">
        <div className="rounded-[2.75rem] border-[10px] border-outline bg-background p-4 shadow-soft">
          <div className="mx-auto mb-4 h-5 w-24 rounded-full bg-outline" />
          <p className="mb-3 font-display text-lg font-extrabold">Nyanya → CBD</p>
          <div className="sticker space-y-3 rounded-xl bg-primary-soft p-4">
            <div className="flex items-baseline justify-between"><p className="font-display text-2xl font-extrabold">7:10 → <span className="text-fg-muted">7:55</span></p><p className="font-display text-lg font-extrabold">₦1,200</p></div>
            <div className="flex items-center justify-between"><span className="text-sm font-bold">Ade O. ★ 4.9</span><SeatDots taken={2} /></div>
            <Badge tone="primary" icon="clock">Leaves 7:10 or when full</Badge>
          </div>
          <div className="mt-4 rounded-xl border border-line bg-surface p-4 text-center">
            <p className="text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Boarding code</p>
            <p className="font-display text-5xl font-extrabold tracking-[0.2em]">4821</p>
          </div>
          <div className="sticker mt-4 grid h-12 place-items-center rounded-lg bg-primary font-bold text-primary-fg">Reserve seat · ₦1,200</div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Built for Nigeria ---------- */
export function NigeriaSection() {
  const items: [IconName, string, string][] = [
    ["cash", "Cash-friendly", "Pay cash with a small hold, or use wallet, transfer or card."],
    ["phone", "Low-data booking", "Book by WhatsApp or USSD. Boarding codes work offline."],
    ["fuel", "Fuel-linked fares", "Prices flex with petrol so drivers stay profitable."],
    ["pin", "Landmark stops", "Nyanya Bridge, AYA Roundabout. Real places, not pins."],
    ["shield", "Safety built in", "ID-verified users, SOS, trusted contacts, women-only cars."],
    ["globe", "Your language", "English, Pidgin and Hausa."],
  ];
  return (
    <section aria-labelledby="ng-title" className="bg-surface-sunken py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-[var(--page-gutter)]">
        <Eyebrow className="mb-3">Built for Nigeria</Eyebrow>
        <h2 id="ng-title" className="mb-10 max-w-3xl text-display-lg">Designed for how Abuja actually moves.</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(([ic, t, b]) => (
            <li key={t} className="rounded-xl border border-line bg-surface p-6">
              <span className="mb-4 grid size-12 place-items-center rounded-[0.9rem] bg-secondary text-primary"><Icon name={ic} size={24} /></span>
              <h3 className="mb-1 text-title">{t}</h3>
              <p className="text-fg-muted">{b}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Safety ---------- */
export function SafetySection() {
  const pts = ["Every driver and rider is ID-verified", "Share live trips with people you trust", "Hold SOS for three seconds to alert contacts and our team", "Choose women-only cars on any route"];
  return (
    <section id="safety" aria-labelledby="safe-title" className="scroll-mt-20 bg-secondary py-20 text-secondary-fg lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-[var(--page-gutter)] lg:grid-cols-[1fr_1.2fr]">
        <ShieldArt className="mx-auto w-52 lg:w-72" />
        <div className="space-y-6">
          <Eyebrow className="text-primary">Safety</Eyebrow>
          <h2 id="safe-title" className="text-display-lg">Strangers become neighbours when everyone is verified.</h2>
          <ul className="space-y-3">{pts.map((p, i) => <li key={p} style={li(i)} className="flex gap-3 text-lg font-semibold"><Icon name="check" size={22} strokeWidth={3} className="mt-0.5 shrink-0 text-primary" />{p}</li>)}</ul>
          <ButtonLink href="/app/safety" iconRight="arrowR">See the safety centre</ButtonLink>
        </div>
      </div>
    </section>
  );
}

/* ---------- Drivers ---------- */
export function DriversSection() {
  const bars = [60, 92, 70, 120, 100, 44, 20];
  return (
    <section id="drivers" aria-labelledby="drv-title" className="scroll-mt-20 bg-primary py-20 text-primary-fg lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-[var(--page-gutter)] lg:grid-cols-2">
        <div className="space-y-6">
          <Eyebrow className="text-primary-fg/70">Drive with MYWAY</Eyebrow>
          <h2 id="drv-title" className="text-display-lg">Drive the trip you already make.</h2>
          <p className="max-w-lg text-body-lg font-medium text-primary-fg/85">Post your route, sell up to four seats, and stop circling for passengers. Verify each rider’s code and get paid the same day.</p>
          <ButtonLink href="/drive/post" variant="secondary" size="lg" iconRight="arrowR">Post your first trip</ButtonLink>
        </div>
        <div className="sticker-lg rounded-2xl bg-secondary p-6 text-secondary-fg sm:p-8" role="img" aria-label="Sample weekly earnings chart">
          <p className="text-sm font-semibold text-secondary-fg/60">This week (sample)</p>
          <p className="mb-5 font-display text-5xl font-extrabold tracking-[-0.04em]">₦86,400</p>
          <div className="flex h-36 items-end justify-between gap-2">
            {bars.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2"><span className={`w-full rounded-lg ${i === 3 ? "bg-primary" : "bg-secondary-fg/20"}`} style={{ height: h }} /><span className="text-xs font-bold text-secondary-fg/60">{"MTWTFSS"[i]}</span></div>
            ))}
          </div>
          <p className="mt-5 text-sm text-secondary-fg/60">Illustrative numbers for the MVP.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------- Final CTA ---------- */
export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="relative overflow-hidden bg-primary text-primary-fg">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-[var(--page-gutter)] pb-24 pt-16 lg:grid-cols-[1.2fr_1fr] lg:pt-24">
        <div className="space-y-6">
          <h2 id="cta-title" className="text-display-lg">Abuja moves.<br />Let’s make it move right.</h2>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/app" variant="secondary" size="lg" iconRight="arrowR">Open the app</ButtonLink>
            <ButtonLink href="/get-started" variant="outline" size="lg">Create an account</ButtonLink>
          </div>
        </div>
        <Danfo className="w-full max-w-lg justify-self-center" />
      </div>
      <StripeBand className="absolute inset-x-0 bottom-0" />
    </section>
  );
}
