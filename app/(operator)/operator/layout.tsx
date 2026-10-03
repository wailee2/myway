import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = { title: { default: "Operator console", template: "%s · MYWAY Operator" } };

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return <AppShell variant="operator">{children}</AppShell>;
}
