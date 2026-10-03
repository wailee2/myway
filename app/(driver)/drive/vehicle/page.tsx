import type { Metadata } from "next";
import { Vehicle } from "@/features/driver/vehicle";

export const metadata: Metadata = { title: "Vehicle and documents" };

export default function Page() {
  return <Vehicle />;
}
