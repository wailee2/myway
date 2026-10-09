import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { DriverTheme } from "@/components/layout/driver-theme";

export const metadata: Metadata = { title: { default: "Drive with MYWAY", template: "%s · MYWAY Drive" } };

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <DriverTheme>
      <AppShell variant="driver">{children}</AppShell>
    </DriverTheme>
  );
}
