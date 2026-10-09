"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { StripeBand } from "@/components/illustrations/brand";
import { Logo } from "@/components/illustrations/brand";
import { Danfo } from "@/components/illustrations/vehicles";
import { ButtonLink } from "@/components/ui/button";
import { useHydrated } from "@/lib/store/hydrate";
import { useSession } from "@/lib/store/session";
import type { Role } from "@/lib/types";

const HOME: Record<Role, string> = { rider: "/app", driver: "/drive", operator: "/operator" };

/**
 * `/`: the first screen after the splash. Signed-in users are sent straight to their app;
 * everyone else chooses between creating an account and logging in.
 */
export function Welcome() {
  const router = useRouter();
  const ready = useHydrated();
  const onboarded = useSession((s) => s.onboarded);
  const role = useSession((s) => s.role);
  const signedIn = ready && onboarded;

  useEffect(() => {
    if (signedIn) router.replace(HOME[role ?? "rider"]);
  }, [signedIn, role, router]);

  // Blank (not the buttons) while we check the session, so a signed-in user never sees a flash of the welcome screen.
  if (!ready || signedIn) return <main id="main" className="min-h-dvh" aria-busy="true" />;

  return (
    <main id="main" className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="px-[var(--page-gutter)] pt-6"><Logo /></div>

      <div className="stagger flex flex-1 flex-col justify-center gap-4 px-[var(--page-gutter)]">
        <h1 style={{ "--i": 1 } as React.CSSProperties} className="text-display-xl">Find someone already going your way.</h1>
        <p style={{ "--i": 2 } as React.CSSProperties} className="text-body-lg font-medium text-fg-muted">Book a seat in a shared car with a verified driver heading the same direction. One clear price, a stop you can find, a ride that leaves on time.</p>
        <div style={{ "--i": 3 } as React.CSSProperties} className="mt-4 grid gap-3">
          <ButtonLink href="/get-started" size="lg" full iconRight="arrowR">Create an account</ButtonLink>
          <ButtonLink href="/login" size="lg" full variant="outline">I already have an account</ButtonLink>
        </div>
      </div>

      {/* Road: the danfo drives across the brand stripe */}
      <div className="relative mt-6 h-[calc(2.25rem+3.5rem)] shrink-0">
        <div aria-hidden="true" className="pointer-events-none absolute bottom-7.5 left-0 w-28 motion-safe:animate-drive">
          <Danfo spin />
        </div>
        <div className="absolute inset-x-0 bottom-0"><StripeBand /></div>
      </div>
    </main>
  );
}
