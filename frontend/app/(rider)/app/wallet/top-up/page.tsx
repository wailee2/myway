import type { Metadata } from "next";
import { TopUp } from "@/features/rider/wallet";

export const metadata: Metadata = { title: "Top up" };

export default async function Page({ searchParams }: { searchParams: Promise<{ amount?: string; return?: string }> }) {
  const sp = await searchParams;
  const amount = Math.max(0, Number(sp.amount) || 0);
  // Only allow returning to our own booking flow.
  const back = sp.return && sp.return.startsWith("/app/") ? sp.return : "/app/wallet";
  return <TopUp initialAmount={amount || 5000} returnTo={back} />;
}
