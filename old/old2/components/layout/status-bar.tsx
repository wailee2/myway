"use client";

import { useEffect, useState } from "react";

function clock() {
  const d = new Date();
  const h = d.getHours() % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * iPhone status bar + notch. Purely decorative, and only visible inside the desktop frame
 * (on a real phone the device draws its own, see `.phone-top` in globals.css).
 */
export function StatusBar() {
  // "9:41" on the server so markup matches; real time after mount.
  const [time, setTime] = useState("9:41");
  useEffect(() => {
    const tick = () => setTime(clock());
    tick();
    const id = window.setInterval(tick, 20_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <div className="phone-top" aria-hidden="true">
        <div className="sb sb-l"><span>{time}</span></div>
        <div className="sb sb-r">
          {/* cellular */}
          <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="0.8" /><rect x="5" y="5.5" width="3" height="6.5" rx="0.8" /><rect x="10" y="3" width="3" height="9" rx="0.8" /><rect x="15" y="0" width="3" height="12" rx="0.8" /></svg>
          {/* wifi */}
          <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor"><path d="M8.5 2.3c2.3 0 4.4.9 6 2.4.1.1.3.1.4 0l1-1c.1-.1.1-.3 0-.4A11.3 11.3 0 0 0 8.5.1C5.5.1 2.7 1.3.6 3.3c-.1.1-.1.3 0 .4l1 1c.1.1.3.1.4 0a8.5 8.5 0 0 1 6.5-2.4Z" /><path d="M8.5 6c1.3 0 2.5.5 3.4 1.3.1.1.3.1.4 0l1-1c.1-.1.1-.3 0-.4A7.4 7.4 0 0 0 8.5 3.8c-1.9 0-3.7.7-4.8 2.1-.1.1-.1.3 0 .4l1 1c.1.1.3.1.4 0A5 5 0 0 1 8.5 6Z" /><path d="M8.5 9.6c.5 0 1-.2 1.4-.6.1-.1.1-.3 0-.4L8.7 7.4a.3.3 0 0 0-.4 0L7.1 8.6c-.1.1-.1.3 0 .4.4.4.9.6 1.4.6Z" /></svg>
          {/* battery */}
          <svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x="0.5" y="0.5" width="23" height="12" rx="3.8" stroke="currentColor" opacity="0.4" /><rect x="2" y="2" width="20" height="9" rx="2.5" fill="currentColor" /><path d="M25 4.5v4c.8-.3 1.5-1.1 1.5-2s-.7-1.7-1.5-2Z" fill="currentColor" opacity="0.45" /></svg>
        </div>
      </div>
      <div className="phone-notch" aria-hidden="true"><i /><i /></div>
    </>
  );
}
