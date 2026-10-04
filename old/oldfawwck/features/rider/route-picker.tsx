"use client";

import { Icon } from "@/components/ui/icon";
import { STOPS } from "@/lib/data/stops";

const sel = "w-full appearance-none rounded-lg border-2 border-line bg-surface-sunken py-3.5 pl-11 pr-10 text-base font-bold text-fg outline-none transition-colors focus:border-line-strong focus:bg-surface";

export function RoutePicker({ from, to, onChange, idPrefix = "rp" }: { from: string; to: string; onChange: (v: { from: string; to: string }) => void; idPrefix?: string }) {
  return (
    <div className="relative grid gap-2.5">
      {([["From", from, "pin", (v: string) => onChange({ from: v, to })], ["To", to, "flag", (v: string) => onChange({ from, to: v })]] as const).map(([label, value, icon, set]) => (
        <div key={label} className="relative">
          <label htmlFor={`${idPrefix}-${label}`} className="sr-only">{label}</label>
          <Icon name={icon} size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted" />
          <select id={`${idPrefix}-${label}`} value={value} onChange={(e) => set(e.target.value)} className={sel}>
            {STOPS.map((s) => <option key={s.id} value={s.id} disabled={s.id === (label === "From" ? to : from)}>{s.name}</option>)}
          </select>
          <Icon name="chevD" size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-muted" />
        </div>
      ))}
      <button type="button" aria-label="Swap from and to" onClick={() => onChange({ from: to, to: from })} className="pressable absolute right-11 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border-2 border-line bg-surface hover:bg-surface-sunken">
        <Icon name="swap" size={16} />
      </button>
    </div>
  );
}
