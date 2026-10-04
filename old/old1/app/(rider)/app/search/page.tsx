import type { Metadata } from "next";
import { SearchResults } from "@/features/rider/search-results";
import { getStop } from "@/lib/data/stops";

export const metadata: Metadata = { title: "Available cars" };

export default async function Page({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const from = getStop(sp.from ?? "") ? sp.from! : "nyanya";
  const to = getStop(sp.to ?? "") && sp.to !== from ? sp.to! : from === "cbd" ? "nyanya" : "cbd";
  return <SearchResults initialFrom={from} initialTo={to} />;
}
