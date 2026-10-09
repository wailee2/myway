import { cn } from "@/lib/cn";

/** Logo mark: black tile with yellow double chevron (direction of travel). */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
      <rect width="48" height="48" rx="14" fill="#0D0D0D" />
      <path d="M13 13l11 11-11 11M25 13l11 11-11 11" stroke="#FFC61A" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <span className="font-display text-[1.65rem] font-extrabold tracking-[-0.05em]">MYWAY</span>
    </span>
  );
}

/** Black band with yellow chevrons, used as section divider and road. */
export function StripeBand({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("stripe-band", className)} />;
}
