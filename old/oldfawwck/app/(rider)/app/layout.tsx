import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = { title: { default: "MYWAY app", template: "%s · MYWAY" } };

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return <AppShell variant="rider">{children}</AppShell>;
}
