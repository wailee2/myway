import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

/** Back link + title row. On desktop the title becomes the page heading. */
export function PageHeader({ title, back, right, sub }: { title: string; back?: string; right?: ReactNode; sub?: string }) {
  return (
    <div className="mb-5 flex items-center gap-3 ">
      {back && (
        <Link href={back} aria-label="Go back" className="pressable grid size-11 shrink-0 place-items-center rounded-full border-2 border-line bg-surface hover:bg-surface-sunken">
          <Icon name="arrowL" size={20} />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-title ">{title}</h1>
        {sub && <p className="truncate text-sm text-fg-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}
