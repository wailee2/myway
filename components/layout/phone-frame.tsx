"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Splash } from "./splash";

/**
 * Wraps the whole app so it feels like a native phone app while staying a normal Next.js site.
 *
 *  - Desktop / tablet: a phone-width, rounded screen with a soft shadow, centred on a grey/dark stage.
 *  - Real phone: no frame, full-bleed, respects safe areas.
 *
 * Scrolling happens inside `.screen-scroll` (not the window), so headers stick and the tab bar pins
 * to the bottom of the *screen*. All sizing lives in globals.css, section 6.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  const [splash, setSplash] = useState(true);
  const done = useCallback(() => setSplash(false), []);

  return (
    <div className="stage">
      <div className="phone">
        <div className="phone-screen" data-splash={splash ? "on" : "off"}>
          <div className="phone-top" aria-hidden="true" />
          <div id="screen-scroll" className="screen-scroll" inert={splash}>
            <a
              href="#main"
              className="sr-only z-[100] rounded-md bg-secondary px-4 py-2 font-bold text-secondary-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
            >
              Skip to content
            </a>
            {children}
          </div>
          {splash && <Splash onDone={done} />}
        </div>
      </div>
    </div>
  );
}
