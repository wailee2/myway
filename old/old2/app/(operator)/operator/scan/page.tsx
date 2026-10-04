import type { Metadata } from "next";
import { ScanTicket } from "@/features/operator/operator";

export const metadata: Metadata = { title: "Scan tickets" };

export default function Page() {
  return <ScanTicket />;
}
