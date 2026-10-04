"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Splash } from "./splash";
import { StatusBar } from "./status-bar";

/**
 * Wraps the whole app so it feels like a native iPhone app while staying a normal Next.js site.
 *
 *  - Desktop / tablet: an iPhone 13/14 (390 x 844) with shadow, centred on a white or dark stage.
 *  - Real phone: no frame, full-bleed, respects safe areas.
 *
 * The scroll happens inside `.screen-scroll` (not the window), so headers stick and the tab bar
 * pins to the bottom of the *screen*. All sizing lives in globals.css, section 6.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  const [splash, setSplash] = useState(true);
  const done = useCallback(() => setSplash(false), []);

  return (
    <div className="stage">
      <div className="phone">
        <span className="phone-btn phone-btn-silent" aria-hidden="true" />
        <span className="phone-btn phone-btn-up" aria-hidden="true" />
        <span className="phone-btn phone-btn-down" aria-hidden="true" />
        <span className="phone-btn phone-btn-power" aria-hidden="true" />

        <div className="phone-screen" data-splash={splash ? "on" : "off"}>
          <StatusBar />
          <div id="screen-scroll" className="screen-scroll" inert={splash}>
            <a
              href="#main"
              className="sr-only z-[100] rounded-md bg-secondary px-4 py-2 font-bold text-secondary-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
            >
              Skip to content
            </a>
            {children}
          </div>
          <div className="home-indicator" aria-hidden="true" />
          {splash && <Splash onDone={done} />}
        </div>
      </div>
    </div>
  );
}
