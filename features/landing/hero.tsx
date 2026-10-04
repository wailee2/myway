import { CarArt, Danfo } from "@/components/illustrations/vehicles";
import { StripeBand } from "@/components/illustrations/brand";
import { HeroWidget } from "./hero-widget";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-primary text-primary-fg">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-[var(--page-gutter)] pb-28 pt-12 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-14 lg:pb-36 lg:pt-20">
        <div className="stagger space-y-6">
          <p style={{ "--i": 0 } as React.CSSProperties} className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-caption font-extrabold uppercase tracking-[0.14em] text-primary">
            Abuja · cars and buses · one app
          </p>
          <h1 id="hero-title" style={{ "--i": 1 } as React.CSSProperties} className="text-display-xl">
            Stop shouting <span className="relative inline-block whitespace-nowrap"><span className="relative z-10">“Along!”</span><span aria-hidden="true" className="absolute inset-x-[-0.04em] bottom-[0.02em] z-0 h-[0.13em] -skew-x-6 bg-secondary" /></span> Book&nbsp;your&nbsp;seat.
          </h1>
          <p style={{ "--i": 2 } as React.CSSProperties} className="max-w-xl text-body-lg font-medium text-primary-fg/85">
            MYWAY turns Abuja’s shared ride into a booked seat: fixed price, four passengers maximum, and a car that leaves on time. No more waiting while the driver hunts for one more person.
          </p>
          <div style={{ "--i": 3 } as React.CSSProperties} className="hidden w-full max-w-sm lg:block">
            <CarArt className="w-72" />
          </div>
        </div>
        <div className="animate-rise [animation-delay:200ms] lg:justify-self-end">
          <HeroWidget />
        </div>
      </div>
      {/* Road: the danfo drives across the brand stripe */}
      <div className="absolute inset-x-0 bottom-0">
        <div aria-hidden="true" className="pointer-events-none absolute bottom-[calc(2.25rem-6px)] left-0 w-32 motion-safe:animate-drive sm:w-44">
          <Danfo spin />
        </div>
        <StripeBand />
      </div>
    </section>
  );
}
