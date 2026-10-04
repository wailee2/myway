import type { Metadata } from "next";
import { Safety } from "@/features/rider/safety";

export const metadata: Metadata = { title: "Safety centre" };

export default function Page() {
  return <Safety />;
}
