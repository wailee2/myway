import type { Metadata } from "next";
import { MyTrips } from "@/features/rider/my-trips";

export const metadata: Metadata = { title: "My trips" };

export default function Page() {
  return <MyTrips />;
}
