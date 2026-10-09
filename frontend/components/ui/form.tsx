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
      className={cn("pressable relative h-7 w-12 shrink-0 rounded-full p-0.5 transition-colors duration-200 before:absolute before:-inset-2 before:content-['']", checked ? "bg-secondary" : "bg-surface-sunken border border-line")}
    >
      <span className={cn("block size-6 rounded-full transition-transform duration-200 ease-out-strong", checked ? "translate-x-5 bg-primary" : "translate-x-0 bg-fg-disabled")} />
    </button>
  );
}

/* ---------- Segmented control (single-choice filter) ----------
 * Semantically a radio group, NOT tabs: it changes a filter or mode, it does not switch panels. */
export function Segmented<T extends string>({ value, onChange, options, label, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: IconName }[]; label: string; className?: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (dir: 1 | -1, i: number) => {
    const n = (i + dir + options.length) % options.length;
    onChange(options[n]!.value);
    refs.current[n]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-full border-2 border-outline bg-surface p-1 ", className)}>
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => { refs.current[i] = el; }}
            role="radio"
            type="button"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); move(1, i); }
              if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); move(-1, i); }
            }}
            className={cn("pressable inline-flex h-11 items-center gap-1.5 rounded-full px-5 text-sm font-bold transition-colors duration-150", on ? "bg-secondary text-primary" : "text-fg hover:bg-surface-sunken")}
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

/* ---------- Confirm sheet (<dialog>) ----------
 * Deliberately NOT showModal(): a modal dialog renders in the browser's top layer and would escape
 * the phone frame. A non-modal dialog with `fixed inset-0` stays inside the screen. We re-add what
 * showModal gave us for free: focus on open, Tab trapped inside the sheet, Esc to close, scrim tap to
 * close, and focus returned to the control that opened it. */
const openers = new WeakMap<HTMLDialogElement, Element | null>();
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function openDialog(el: HTMLDialogElement | null | undefined) {
  if (!el) return;
  openers.set(el, document.activeElement);
  el.show();
  (el.querySelector<HTMLElement>("[data-autofocus]") ?? el.querySelector<HTMLElement>("button, input"))?.focus();
}

export function useDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  return { ref, open: () => openDialog(ref.current), close: () => ref.current?.close() };
}

export function Dialog({ dialogRef, title, children, tall, onClosed }: { dialogRef: React.RefObject<HTMLDialogElement | null>; title: string; children: ReactNode; tall?: boolean; onClosed?: () => void }) {
  const tid = useId();
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={tid}
      aria-modal="true"
      className="fixed inset-0 z-[80] m-0 hidden h-full max-h-none w-full max-w-none items-end border-0 bg-overlay p-0 text-fg open:flex open:animate-fade"
      onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
      onClose={(e) => { const o = openers.get(e.currentTarget); if (o instanceof HTMLElement) o.focus(); onClosed?.(); }}
      onKeyDown={(e) => {
        if (e.key === "Escape") { e.currentTarget.close(); return; }
        if (e.key !== "Tab") return;
        const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
        if (!items.length) return;
        const first = items[0]!;
        const last = items[items.length - 1]!;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }}
    >
      <div className={cn("flex w-full animate-sheet flex-col rounded-t-2xl border-t-2 border-outline bg-surface p-6 pb-[calc(1.5rem+var(--safe-bottom))]", tall ? "h-[88%]" : "max-h-[92%] overflow-y-auto")}>
        <div aria-hidden="true" className="mx-auto mb-4 h-1.5 w-10 shrink-0 rounded-full bg-line-strong/30" />
        <h2 id={tid} className="mb-3 shrink-0 text-title">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
