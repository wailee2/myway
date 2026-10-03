import type { Metadata } from "next";
import { Help } from "@/features/rider/help";

export const metadata: Metadata = { title: "Help and support" };

export default function Page() {
  return <Help />;
}
