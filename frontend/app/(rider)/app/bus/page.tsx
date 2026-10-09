import type { Metadata } from "next";
import { BusList } from "@/features/rider/bus";

export const metadata: Metadata = { title: "Bus lines" };

export default function Page() {
  return <BusList />;
}
