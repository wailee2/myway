import type { Metadata } from "next";
import { Onboarding } from "@/features/auth/onboarding";

export const metadata: Metadata = { title: "Get started" };

export default function GetStartedPage() {
  return <Onboarding />;
}
