import type { Metadata } from "next";
import { RateRide } from "@/features/rider/rate";

export const metadata: Metadata = { title: "Rate your ride" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RateRide id={id} />;
}
