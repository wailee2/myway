"use client";

import { useResolvedTheme } from "@/lib/hooks/use-theme";

/** The driver app is dark by default (glare-friendly at night) but follows the toggle once you pick a mode. */
export function DriverTheme({ children }: { children: React.ReactNode }) {
  const { mode } = useResolvedTheme("dark");
  return <div data-theme={mode} className="bg-background text-fg">{children}</div>;
}
