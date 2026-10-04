import type { Metadata } from "next";
import { TopUp } from "@/features/rider/wallet";

export const metadata: Metadata = { title: "Top up" };

export default function Page() {
  return <TopUp />;
}
