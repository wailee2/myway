"use client";

import { useEffect, useState } from "react";
import { fetchTrip } from "../api/rides";
import { LIVE } from "../api/live";
import { getDriver, getTrip } from "../data/trips";

/** A trip by id. With the backend on, fetches it if this page was opened directly and it isn't loaded yet. */
export function useTrip(id: string | undefined) {
  const [fetched, setFetched] = useState<"none" | "done" | "failed">("none");
  const known = id ? getTrip(id) : undefined;
  useEffect(() => {
    if (!LIVE || !id || getTrip(id)) return;
    let alive = true;
    fetchTrip(id).then(() => alive && setFetched("done"), () => alive && setFetched("failed"));
    return () => { alive = false; };
  }, [id]);
  const trip = known ?? (id && fetched === "done" ? getTrip(id) : undefined);
  return { trip, driver: trip ? getDriver(trip.driverId) : undefined, loading: LIVE && Boolean(id) && !trip && fetched === "none" };
}
