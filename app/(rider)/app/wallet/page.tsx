import type { Metadata } from "next";
import { Wallet } from "@/features/rider/wallet";

export const metadata: Metadata = { title: "Wallet" };

export default function Page() {
  return <Wallet />;
}
