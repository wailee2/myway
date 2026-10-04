import type { Metadata } from "next";
import { Manifest } from "@/features/operator/operator";

export const metadata: Metadata = { title: "Manifest" };

export default function Page() {
  return <Manifest />;
}
