import type { Metadata } from "next";
import { LiveTrip } from "@/features/driver/live-trip";

export const metadata: Metadata = { title: "Live trip" };

export default function Page() {
  return <LiveTrip />;
}
