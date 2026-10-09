"use client";

import { useEffect, useState } from "react";

/** Counts down once per second. Pauses while the tab is hidden. */
export function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") setLeft((v) => Math.max(0, v - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  return left;
}
