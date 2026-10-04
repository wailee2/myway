import type { Metadata } from "next";
import { Passes } from "@/features/rider/passes";

export const metadata: Metadata = { title: "Commuter passes" };

export default function Page() {
  return <Passes />;
}
