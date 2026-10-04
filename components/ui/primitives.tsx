import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { initials as toInitials } from "@/lib/format";
import { Icon, type IconName } from "./icon";

/* ---------- Card ---------- */
type CardTone = "default" | "sticker" | "soft" | "inverse" | "primary";
const cardTone: Record<CardTone, string> = {
  default: "border border-line bg-surface",
  sticker: "sticker bg-surface",
  soft: "bg-surface-sunken",
  inverse: "bg-secondary text-secondary-fg",
  primary: "sticker bg-primary text-primary-fg",
};
export function Card({ tone = "default", className, ...rest }: { tone?: CardTone } & HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl p-4", cardTone[tone], className)} {...rest} />;
}

/* ---------- Badge / Chip ---------- */
type BadgeTone = "neutral" | "success" | "warning" | "danger" | "primary" | "ink" | "info";
const badgeTone: Record<BadgeTone, string> = {
  neutral: "bg-surface-sunken text-fg-secondary",
  success: "bg-success-soft text-success-text",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-danger-soft text-danger-text",
  info: "bg-info-soft text-info",
  primary: "bg-primary text-primary-fg",
  ink: "bg-outline text-primary",
};
export function Badge({ tone = "neutral", icon, className, children }: { tone?: BadgeTone; icon?: IconName; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-caption font-bold", badgeTone[tone], className)}>
      {icon && <Icon name={icon} size={13} strokeWidth={2.6} />}
      {children}
    </span>
  );
}

export function Chip({ active, icon, children, className, ...rest }: { active?: boolean; icon?: IconName } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "pressable inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[0.8125rem] font-bold",
        active ? "bg-secondary text-secondary-fg" : "border border-line bg-surface-sunken text-fg hover:bg-surface",
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={16} strokeWidth={2.2} className={active ? "text-primary" : undefined} />}
      {children}
    </button>
  );
}

/* ---------- Avatar ---------- */
const avatarTones = ["bg-primary-soft", "bg-map-water", "bg-map-park", "bg-primary"] as const;
export function Avatar({ name, size = 40, tone, className }: { name: string; size?: number; tone?: 0 | 1 | 2 | 3 | "ink"; className?: string }) {
  const bg = tone === "ink" ? "bg-secondary text-primary" : `${avatarTones[typeof tone === "number" ? tone : name.length % 3]} text-primary-fg`;
  return (
    <span
      aria-hidden="true"
      className={cn("inline-grid shrink-0 place-items-center rounded-full border-2 border-outline font-sans font-bold", bg, className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {toInitials(name)}
    </span>
  );
}

/* ---------- Seat dots (4-seat capacity) ---------- */
export function SeatDots({ taken, total = 4 }: { taken: number; total?: number }) {
  return (
    <span className="inline-flex gap-1" role="img" aria-label={`${taken} of ${total} seats taken`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cn("size-3.5 rounded-[4px] border-2 border-outline", i < taken ? "bg-outline" : "bg-surface")} />
      ))}
    </span>
  );
}

/* ---------- Progress ---------- */
export function Progress({ value, tone = "primary", label }: { value: number; tone?: "primary" | "success"; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} className="h-2.5 overflow-hidden rounded-full border border-line bg-surface-sunken">
      <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out-strong", tone === "success" ? "bg-success" : "bg-primary")} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/* ---------- Banner (inline status message) ---------- */
type BannerTone = "success" | "warning" | "danger" | "info" | "primary";
const bannerTone: Record<BannerTone, string> = {
  success: "bg-success-soft text-success-text",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-danger-soft text-danger-text",
  info: "bg-info-soft text-info",
  primary: "bg-primary-soft text-fg",
};
export function Banner({ tone = "info", icon, children, className }: { tone?: BannerTone; icon?: IconName; children: ReactNode; className?: string }) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-lg p-3.5 text-sm font-semibold leading-snug", bannerTone[tone], className)}>
      {icon && <Icon name={icon} size={20} strokeWidth={2.4} className="mt-px shrink-0" />}
      <div>{children}</div>
    </div>
  );
}

/* ---------- Row (list item with icon tile) ---------- */
export function Row({ icon, title, sub, right, tone = "neutral", className, as: Tag = "div" }: { icon: IconName; title: ReactNode; sub?: ReactNode; right?: ReactNode; tone?: "neutral" | "primary" | "success" | "danger"; className?: string; as?: "div" | "li" }) {
  const tile = { neutral: "bg-surface-sunken text-fg", primary: "bg-primary text-primary-fg", success: "bg-success-soft text-success-text", danger: "bg-danger-soft text-danger-text" }[tone];
  return (
    <Tag className={cn("flex items-center gap-3.5 py-2.5", className)}>
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-[0.875rem]", tile)}>
        <Icon name={icon} size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.95rem] font-bold">{title}</span>
        {sub && <span className="block truncate text-[0.8125rem] text-fg-muted">{sub}</span>}
      </span>
      {right}
    </Tag>
  );
}

/* ---------- Eyebrow / section label ---------- */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted", className)}>{children}</p>;
}

/* ---------- Empty state ---------- */
export function EmptyState({ title, body, action, children }: { title: string; body: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-4 rounded-xl border border-dashed border-line-strong/40 px-6 py-10 text-center">
      {children}
      <div className="max-w-sm space-y-1.5">
        <h3 className="text-title">{title}</h3>
        <p className="text-fg-muted">{body}</p>
      </div>
      {action}
    </div>
  );
}
