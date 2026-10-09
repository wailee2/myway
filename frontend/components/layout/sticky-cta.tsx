import type { ReactNode } from "react";

/**
 * Bottom-pinned action bar for the booking flow (trip detail → checkout), where the tab bar is hidden.
 * `children` is normally one primary Button. `summary` sits above it (price, rule…).
 */
export function StickyCta({ children, summary }: { children: ReactNode; summary?: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-[var(--page-gutter)] pt-3 pb-[calc(0.75rem+var(--safe-bottom))] backdrop-blur">
      <div className="mx-auto grid w-full max-w-2xl gap-2.5">
        {summary}
        {children}
      </div>
    </div>
  );
}
