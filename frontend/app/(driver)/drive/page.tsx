import type { Metadata } from "next";
import { DriverHome } from "@/features/driver/driver-home";

export const metadata: Metadata = { title: "Drive" };

export default function Page() {
  return <DriverHome />;
}
