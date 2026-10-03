"use client";

import { useTheme, type Theme } from "@/lib/hooks/use-theme";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

const next: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
const icon: Record<Theme, IconName> = { system: "sliders", light: "sun", dark: "moon" };
const text: Record<Theme, string> = { system: "Match device", light: "Light", dark: "Dark" };

export function ThemeToggle({ className, withLabel }: { className?: string; withLabel?: boolean }) {
  const { theme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(next[theme])}
      aria-label={`Theme: ${text[theme]}. Switch to ${text[next[theme]]}`}
      className={cn("pressable inline-flex h-11 items-center gap-2 rounded-full border-2 border-line bg-surface px-3.5 text-sm font-bold text-fg hover:bg-surface-sunken", className)}
    >
      <Icon name={icon[theme]} size={18} />
      {withLabel && <span>{text[theme]}</span>}
    </button>
  );
}
