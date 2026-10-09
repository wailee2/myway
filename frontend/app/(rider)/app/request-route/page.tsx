import type { Metadata } from "next";
import { RequestRoute } from "@/features/rider/request-route";
import { getStop } from "@/lib/data/stops";

export const metadata: Metadata = { title: "Request a route" };

export default async function Page({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  return <RequestRoute initialFrom={getStop(sp.from ?? "")?.name ?? ""} initialTo={getStop(sp.to ?? "")?.name ?? ""} />;
}
