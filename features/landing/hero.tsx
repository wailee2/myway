import { CarArt, Danfo } from "@/components/illustrations/vehicles";
import { StripeBand } from "@/components/illustrations/brand";
import { HeroWidget } from "./hero-widget";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-background ">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-(--page-gutter) pb-28 pt-12 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-14 lg:pb-39 lg:pt-15">
        <div className="stagger space-y-6">
          <h1 id="hero-title" style={{ "--i": 1 } as React.CSSProperties} className="text-display-xl">
            Go your way with MyWay.
          </h1>
          <p style={{ "--i": 2 } as React.CSSProperties} className="max-w-xl text-body-lg font-medium text-fg-muted">
            A shared ride that’s booked, fixed price, and leaves on time.
          </p>
        </div>
        <div className="animate-rise [animation-delay:200ms] lg:justify-self-end">
          <HeroWidget />
        </div>
      </div>
      {/* Road: the danfo drives across the brand stripe */}
      <div className="absolute inset-x-0 bottom-0 ">
        <div aria-hidden="true" className="pointer-events-none absolute bottom-7.5 left-0 w-32 motion-safe:animate-drive sm:w-44">
          <Danfo spin />
        </div>
        <StripeBand />
      </div>
    </section>
  );
}
