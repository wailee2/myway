import type { Metadata } from "next";
import { SearchResults } from "@/features/rider/search-results";
import { getStop } from "@/lib/data/stops";

export const metadata: Metadata = { title: "Rides for your route" };

export default async function Page({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; day?: string }> }) {
  const sp = await searchParams;
  const from = getStop(sp.from ?? "") ? sp.from! : "";
  const to = getStop(sp.to ?? "") && sp.to !== from ? sp.to! : "";
  const day = Math.min(3, Math.max(0, Number(sp.day) || 0));
  return <SearchResults initialFrom={from} initialTo={to} initialDay={day} />;
}
