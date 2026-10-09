import type { Metadata } from "next";
import { BusLine } from "@/features/rider/bus";

export const metadata: Metadata = { title: "Bus line" };

export default async function Page({ params }: { params: Promise<{ line: string }> }) {
  const { line } = await params;
  return <BusLine lineId={line} />;
}
