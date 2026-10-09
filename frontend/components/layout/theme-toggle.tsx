"use client";

import { useResolvedTheme } from "@/lib/hooks/use-theme";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/** One-tap light/dark switch. Shows the mode you'll switch *to* (sun while dark, moon while light). */
export function ThemeToggle({ className, withLabel, fallback }: { className?: string; withLabel?: boolean; fallback?: "light" | "dark" }) {
  const { mode, toggle } = useResolvedTheme(fallback);
  const next = mode === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      className={cn("pressable inline-flex h-11 items-center gap-2 rounded-full border-2 border-line bg-surface px-3.5 text-sm font-bold text-fg hover:bg-surface-sunken", className)}
    >
      <Icon name={mode === "dark" ? "sun" : "moon"} size={18} className="shrink-0" />
      {withLabel && <span>{next === "light" ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
