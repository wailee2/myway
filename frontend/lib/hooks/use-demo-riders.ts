"use client";

import { useEffect } from "react";
import { DEMO, DEMO_DRIVER_RIDERS } from "../demo";
import { useDriver } from "../store/driver";

/** DEMO ONLY: simulates riders booking seats on the driver's posted trip. In production these arrive from the backend. */
export function useDemoRiders() {
  const trip = useDriver((s) => s.activeTrip);
  const count = useDriver((s) => s.riders.length);
  const addRider = useDriver((s) => s.addRider);
  useEffect(() => {
    if (!DEMO || !trip || count >= Math.min(trip.seats, DEMO_DRIVER_RIDERS.length)) return;
    const id = window.setTimeout(() => addRider(DEMO_DRIVER_RIDERS[count]!), 2600);
    return () => window.clearTimeout(id);
  }, [trip, count, addRider]);
}
