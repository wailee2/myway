"use client";

import { useId, useRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./icon";

/* ---------- Field + Input ---------- */
interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  hint?: string;
  error?: string;
  icon?: IconName;
  trailing?: ReactNode;
}

export function Field({ label, hint, error, icon, trailing, className, id, ...rest }: FieldProps) {
  const auto = useId();
  const fid = id ?? auto;
  const describedBy = error ? `${fid}-err` : hint ? `${fid}-hint` : undefined;
  return (
    <div className={className}>
      <label
        htmlFor={fid}
        className={cn(
          "flex min-h-[3.75rem] cursor-text items-center gap-3 rounded-lg border-2 bg-surface-sunken px-4 transition-colors duration-150 focus-within:border-line-strong focus-within:bg-surface",
          error ? "border-danger" : "border-line",
        )}
      >
        {icon && <Icon name={icon} size={20} className="shrink-0 text-fg-muted" />}
        <span className="flex min-w-0 flex-1 flex-col py-2">
          <span className="text-caption font-semibold text-fg-muted">{label}</span>
          <input
            id={fid}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className="w-full bg-transparent text-base font-bold text-fg outline-none placeholder:font-semibold placeholder:text-fg-disabled"
            {...rest}
          />
        </span>
        {trailing}
      </label>
      {error ? (
        <p id={`${fid}-err`} role="alert" className="mt-1.5 text-sm font-semibold text-danger-text">{error}</p>
      ) : hint ? (
        <p id={`${fid}-hint`} className="mt-1.5 text-sm text-fg-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/* ---------- Switch ---------- */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("pressable relative h-7 w-12 shrink-0 rounded-full p-0.5 transition-colors duration-200", checked ? "bg-secondary" : "bg-surface-sunken border border-line")}
    >
      <span className={cn("block size-6 rounded-full transition-transform duration-200 ease-out-strong", checked ? "translate-x-5 bg-primary" : "translate-x-0 bg-fg-disabled")} />
    </button>
  );
}

/* ---------- Segmented control (tabs) ---------- */
export function Segmented<T extends string>({ value, onChange, options, label, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: IconName }[]; label: string; className?: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (dir: 1 | -1, i: number) => {
    const n = (i + dir + options.length) % options.length;
    onChange(options[n]!.value);
    refs.current[n]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className={cn("inline-flex rounded-full border-2 border-outline bg-surface p-1 shadow-hard", className)}>
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => { refs.current[i] = el; }}
            role="tab"
            type="button"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") move(1, i);
              if (e.key === "ArrowLeft") move(-1, i);
            }}
            className={cn("pressable inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-sm font-bold transition-colors duration-150", on ? "bg-secondary text-primary" : "text-fg hover:bg-surface-sunken")}
          >
            {o.icon && <Icon name={o.icon} size={18} strokeWidth={2.2} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Radio card (payment method, reason, plan) ---------- */
export function RadioCard({ checked, onSelect, icon, title, sub, name }: { checked: boolean; onSelect: () => void; icon?: IconName; title: string; sub?: string; name: string }) {
  return (
    <label
      className={cn(
        "pressable flex cursor-pointer items-center gap-3.5 rounded-lg border-2 p-3.5 transition-colors duration-150",
        checked ? "border-line-strong bg-primary-soft" : "border-line bg-surface hover:bg-surface-sunken",
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="peer sr-only" />
      {icon && (
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-[0.75rem]", checked ? "bg-primary text-primary-fg" : "bg-surface-sunken")}>
          <Icon name={icon} size={20} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        {sub && <span className="block text-[0.8125rem] text-fg-muted">{sub}</span>}
      </span>
      <span aria-hidden="true" className={cn("grid size-6 shrink-0 place-items-center rounded-full", checked ? "bg-secondary text-primary" : "border-2 border-fg-disabled")}>
        {checked && <Icon name="check" size={14} strokeWidth={3.5} />}
      </span>
      <span className="pointer-events-none absolute inset-0 rounded-lg peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-ring" />
    </label>
  );
}

/* ---------- Native <dialog> confirm ---------- */
export function useDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  return { ref, open: () => ref.current?.showModal(), close: () => ref.current?.close() };
}

export function Dialog({ dialogRef, title, children }: { dialogRef: React.RefObject<HTMLDialogElement | null>; title: string; children: ReactNode }) {
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="dialog-title"
      className="m-auto w-[min(92vw,26rem)] rounded-xl border-2 border-outline bg-surface p-6 text-fg shadow-hard-lg open:animate-pop"
      onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
    >
      <h2 id="dialog-title" className="mb-3 text-title">{title}</h2>
      {children}
    </dialog>
  );
}
