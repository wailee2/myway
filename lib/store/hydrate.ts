"use client";

import { useEffect, useState } from "react";
import { useBooking } from "./booking";
import { useDriver } from "./driver";
import { useSession } from "./session";

/** Rehydrates all persisted stores after mount so SSR markup always matches the first client render. */
export function useHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    Promise.all([useSession.persist.rehydrate(), useBooking.persist.rehydrate(), useDriver.persist.rehydrate()]).then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}
