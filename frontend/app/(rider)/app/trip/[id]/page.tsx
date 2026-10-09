import type { Metadata } from "next";
import { TripDetail } from "@/features/rider/trip-detail";

export const metadata: Metadata = { title: "Ride details" };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string; to?: string; day?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  return <TripDetail id={id} from={sp.from} to={sp.to} day={Math.min(3, Math.max(0, Number(sp.day) || 0))} />;
}
