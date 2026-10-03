import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./icon";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "pressable inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-sans font-bold leading-none disabled:pointer-events-none disabled:border-line disabled:bg-surface-sunken disabled:text-fg-disabled disabled:shadow-none aria-disabled:pointer-events-none aria-disabled:border-line aria-disabled:bg-surface-sunken aria-disabled:text-fg-disabled aria-disabled:shadow-none";

const variants: Record<Variant, string> = {
  primary: "sticker bg-primary text-primary-fg hover:bg-primary-hover active:bg-primary-active",
  secondary: "bg-secondary text-secondary-fg hover:bg-secondary-hover",
  outline: "border-2 border-line-strong bg-surface text-fg hover:bg-surface-sunken",
  ghost: "text-fg hover:bg-surface-sunken",
  danger: "border-2 border-danger bg-surface text-danger-text hover:bg-danger-soft",
};

const sizes: Record<Size, string> = {
  sm: "h-10 rounded-md px-4 text-sm",
  md: "h-12 rounded-lg px-5 text-[0.95rem]",
  lg: "h-14 rounded-lg px-6 text-base",
};

export function buttonStyles({ variant = "primary", size = "md", full }: { variant?: Variant; size?: Size; full?: boolean } = {}) {
  return cn(base, variants[variant], sizes[size], full && "w-full");
}

interface Extras {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  icon?: IconName;
  iconRight?: IconName;
}

function Content({ icon, iconRight, children }: Pick<Extras, "icon" | "iconRight"> & { children?: React.ReactNode }) {
  return (
    <>
      {icon && <Icon name={icon} size={20} strokeWidth={2.2} />}
      {children}
      {iconRight && <Icon name={iconRight} size={20} strokeWidth={2.2} />}
    </>
  );
}

export function Button({ variant, size, full, icon, iconRight, className, children, type = "button", ...rest }: Extras & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={cn(buttonStyles({ variant, size, full }), className)} {...rest}>
      <Content icon={icon} iconRight={iconRight}>{children}</Content>
    </button>
  );
}

export function ButtonLink({ variant, size, full, icon, iconRight, className, children, ...rest }: Extras & ComponentProps<typeof Link>) {
  return (
    <Link className={cn(buttonStyles({ variant, size, full }), className)} {...rest}>
      <Content icon={icon} iconRight={iconRight}>{children}</Content>
    </Link>
  );
}

export function IconButton({ icon, label, className, ...rest }: { icon: IconName; label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label={label} className={cn("pressable grid size-11 place-items-center rounded-full border-2 border-line bg-surface text-fg hover:bg-surface-sunken", className)} {...rest}>
      <Icon name={icon} size={20} />
    </button>
  );
}
