import Link from "next/link";
import { Logo, StripeBand } from "@/components/illustrations/brand";

const cols = [
  { title: "Product", links: [["Book a car", "/app"], ["Ride a bus", "/app/bus"], ["Commuter passes", "/app/passes"], ["Request a route", "/app/request-route"]] },
  { title: "Drivers & operators", links: [["Drive with MYWAY", "/drive"], ["Post a trip", "/drive/post"], ["Bus operators", "/operator"]] },
  { title: "Help", links: [["Safety centre", "/app/safety"], ["Help and support", "/app/help"], ["FAQ", "/#faq"]] },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-secondary text-secondary-fg">
      <StripeBand />
      <div className="mx-auto grid max-w-7xl gap-12 px-[var(--page-gutter)] py-14 lg:grid-cols-[1.4fr_2fr]">
        <div className="space-y-4">
          <Logo className="[&_span]:text-secondary-fg" />
          <p className="max-w-xs text-secondary-fg/70">Board once. Arrive on time. Seat-booked shared rides and scheduled buses for Abuja.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {cols.map((c) => (
            <div key={c.title}>
              <h2 className="mb-3 font-sans text-caption font-extrabold uppercase tracking-[0.14em] text-primary">{c.title}</h2>
              <ul className="space-y-2.5">
                {c.links.map(([label, href]) => (
                  <li key={label}><Link href={href} className="text-secondary-fg/80 transition-colors hover:text-primary">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-secondary-fg/10 px-[var(--page-gutter)] py-5 text-center text-sm text-secondary-fg/60">
        MVP prototype · bookings, drivers and payments are simulated · © 2026 MYWAY
      </div>
    </footer>
  );
}
