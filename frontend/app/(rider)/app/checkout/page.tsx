import type { Metadata } from "next";
import { Checkout } from "@/features/rider/checkout";

export const metadata: Metadata = { title: "Checkout" };

export default async function Page({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  return <Checkout kind={kind === "bus" ? "bus" : "car"} />;
}
