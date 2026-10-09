import { Icon, type IconName } from "@/components/ui/icon";
import { COPY } from "@/lib/policy";
import { formatTime } from "@/lib/format";

/** The departure rule and the cancellation policy. Same words on trip detail, checkout, booking and the cancel dialog. */
export function PolicyNote({ departAt, only }: { departAt: string; only?: "departure" | "cancellation" }) {
  const rows: { icon: IconName; title: string; body: string; key: string }[] = [
    { key: "departure", icon: "clock", title: "When it leaves", body: COPY.departure(formatTime(departAt)) },
    { key: "cancellation", icon: "shield", title: "Cancelling", body: COPY.cancellation },
  ];
  return (
    <ul className="space-y-3">
      {rows.filter((r) => !only || r.key === only).map((r) => (
        <li key={r.key} className="flex items-start gap-3">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[0.75rem] bg-surface-sunken"><Icon name={r.icon} size={18} /></span>
          <span className="min-w-0 flex-1 text-sm"><span className="block font-bold">{r.title}</span><span className="text-fg-secondary">{r.body}</span></span>
        </li>
      ))}
    </ul>
  );
}
