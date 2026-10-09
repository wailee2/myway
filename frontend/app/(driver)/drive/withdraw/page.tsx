import type { Metadata } from "next";
import { Withdraw } from "@/features/driver/withdraw";

export const metadata: Metadata = { title: "Withdraw" };

export default function Page() {
  return <Withdraw />;
}
