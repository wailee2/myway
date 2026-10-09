import type { ReactNode } from "react";
import { DEMO } from "@/lib/demo";

/** Wrapper for any prototype-only control. Renders nothing unless NEXT_PUBLIC_DEMO is on. */
export function DemoPanel({ title, children }: { title: string; children: ReactNode }) {
  if (!DEMO) return null;
  return (
    <div className="rounded-xl border-2 border-dashed border-line-strong/40 p-4" role="group" aria-label={title}>
      <p className="mb-2.5 text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">{title}</p>
      {children}
    </div>
  );
}
