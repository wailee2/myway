import type { Metadata } from "next";
import { OperatorDashboard } from "@/features/operator/operator";

export const metadata: Metadata = { title: "Dashboard" };

export default function Page() {
  return <OperatorDashboard />;
}
