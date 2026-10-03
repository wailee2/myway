import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = { title: { default: "Drive with MYWAY", template: "%s · MYWAY Drive" } };

/** The driver app is dark by default (glare-friendly at night). `data-theme` scopes the dark tokens to this subtree. */
export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" className="bg-background text-fg">
      <AppShell variant="driver">{children}</AppShell>
    </div>
  );
}
