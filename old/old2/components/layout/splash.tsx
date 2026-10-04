"use client";

import { useEffect, useState } from "react";
import { Danfo } from "@/components/illustrations/vehicles";
import { StripeBand } from "@/components/illustrations/brand";

/**
 * Launch screen, like a native app: the logo pops in, the chevrons draw themselves,
 * and the danfo drives across the brand stripe before the screen fades away.
 * Plays on every full page load (not on in-app navigation).
 */
export function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = reduced ? 700 : 2400;
    const t1 = window.setTimeout(() => setLeaving(true), hold);
    const t2 = window.setTimeout(onDone, hold + (reduced ? 50 : 450));
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      role="status"
      aria-label="Loading MYWAY"
      className={`absolute inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#ffc61a] text-[#0d0d0d] ${leaving ? "animate-splash-out" : ""}`}
    >
      <div className="flex flex-col items-center gap-5 pb-16">
        <svg width="104" height="104" viewBox="0 0 48 48" fill="none" aria-hidden="true" className="animate-logo-pop drop-shadow-[0_14px_0_rgb(0_0_0/0.14)]">
          <rect width="48" height="48" rx="14" fill="#0D0D0D" />
          <path d="M13 13l11 11-11 11M25 13l11 11-11 11" pathLength={1} stroke="#FFC61A" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1" className="animate-draw" />
        </svg>
        <p className="animate-rise font-display text-[2.75rem] font-extrabold leading-none tracking-[-0.05em] [animation-delay:650ms]">MYWAY</p>
        <p className="animate-rise text-sm font-bold tracking-wide text-[#0d0d0d]/70 [animation-delay:850ms]">Board once. Arrive on time.</p>
      </div>

      {/* Road */}
      <div className="absolute inset-x-0 bottom-0">
        <div aria-hidden="true" className="absolute bottom-9 left-0 w-28 animate-splash-drive motion-reduce:hidden">
          <Danfo spin />
        </div>
        <StripeBand />
        <div className="h-[var(--safe-bottom)] bg-[#0d0d0d]" />
      </div>
    </div>
  );
}
