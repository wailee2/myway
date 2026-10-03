import type { Metadata } from "next";
import { TripDetail } from "@/features/rider/trip-detail";

export const metadata: Metadata = { title: "Trip details" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TripDetail id={id} />;
}
