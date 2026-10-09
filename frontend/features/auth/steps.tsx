"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { nationalPhone, phoneInput } from "@/lib/input";
import { cn } from "@/lib/cn";

/** Shared by sign-up and log-in so both behave identically. */

export const Heading = forwardRef<HTMLHeadingElement, { title: string; body: string }>(function Heading({ title, body }, ref) {
  return (
    <div className="space-y-2">
      <h1 ref={ref} tabIndex={-1} className="text-display-md outline-none">{title}</h1>
      <p className="text-fg-muted">{body}</p>
    </div>
  );
});

export function Cta({ children, ...rest }: React.ComponentProps<typeof Button>) {
  return <Button size="lg" full iconRight={rest.icon ? undefined : "arrowR"} className="mt-auto" {...rest}>{children}</Button>;
}

/* ---------- Phone number ---------- */
export function PhoneStep({ headingRef, title, body, phone, setPhone, error, onSubmit, cta, footer }: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  title: string; body: string;
  phone: string; setPhone: (v: string) => void;
  error: string; onSubmit: () => void; cta: string; footer?: React.ReactNode;
}) {
  return (
    <form className="flex flex-1 flex-col gap-6" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <Heading ref={headingRef} title={title} body={body} />
      <Field
        label="Mobile number"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        enterKeyHint="send"
        placeholder="8031234567"
        value={phone}
        onChange={(e) => setPhone(phoneInput(e.target.value))}
        error={error}
        icon="phone"
        trailing={<span className="text-sm font-bold text-fg-muted">+234</span>}
      />
      <p className="text-sm text-fg-muted">Just type the digits, no spaces needed.</p>
      <Cta type="submit">{cta}</Cta>
      {footer}
    </form>
  );
}

/** Returns an error message, or "" when the number is fine. */
export function checkPhone(phone: string) {
  return nationalPhone(phone) ? "" : "Enter a valid Nigerian mobile number, e.g. 8031234567.";
}

/* ---------- 6-digit code ---------- */
const OTP_LEN = 6;

export function OtpStep({ headingRef, phone, otp, setOtp, error, onSubmit, note }: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  phone: string; otp: string; setOtp: (v: string) => void;
  error: string; onSubmit: () => void; note?: string;
}) {
  const [round, setRound] = useState(0);
  const [left, setLeft] = useState(24);
  useEffect(() => {
    const id = window.setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(id);
  }, [round]);
  const resend = () => { setLeft(24); setRound((r) => r + 1); setOtp(""); inputs.current[0]?.focus(); };
  // Submit as soon as the sixth digit lands, so nobody has to hunt for the button.
  useEffect(() => {
    if (otp.length === OTP_LEN) onSubmit();
    // onSubmit changes identity every render; we only want to react to the code itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: OTP_LEN }, (_, i) => otp[i] ?? "");
  const focus = (i: number) => inputs.current[Math.max(0, Math.min(OTP_LEN - 1, i))]?.focus();
  const clean = (v: string) => v.replace(/\D/g, "");

  const change = (i: number, raw: string) => {
    const d = clean(raw);
    if (!d) { // box emptied: drop that digit
      setOtp(otp.slice(0, i) + otp.slice(i + 1));
      return;
    }
    const old = digits[i];
    // Typed one digit into a box that already had one: keep only the new digit.
    if (old && d.length === 2) {
      const typed = d.replace(old, "");
      const next = (otp.slice(0, i) + typed + otp.slice(i + 1)).slice(0, OTP_LEN);
      setOtp(next);
      focus(i + 1);
      return;
    }
    // Typed into an empty box, or autofill / paste of the whole code: never exceed 6 digits.
    const next = (otp.slice(0, i) + d).slice(0, OTP_LEN);
    setOtp(next);
    focus(next.length);
  };

  return (
    <form className="flex flex-1 flex-col gap-6" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <div className="space-y-2">
        <h1 ref={headingRef} tabIndex={-1} className="text-display-md outline-none">Enter the code</h1>
        <p className="text-fg-muted">Sent to +234 {nationalPhone(phone) ?? clean(phone)}</p>
      </div>
      <div className="flex gap-2" role="group" aria-label="6-digit code">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${i + 1}`}
            value={d}
            onFocus={(e) => e.target.select()}
            onChange={(e) => change(i, e.target.value)}
            onPaste={(e) => { e.preventDefault(); const v = clean(e.clipboardData.getData("text")).slice(0, OTP_LEN); setOtp(v); focus(v.length); }}
            onKeyDown={(e) => {
              // A filled box with nothing selected ignores further digits, so the code can never exceed 6 digits.
              if (/^\d$/.test(e.key) && d && e.currentTarget.selectionStart === e.currentTarget.selectionEnd) e.preventDefault();
              if (e.key === "Backspace" && !d) { setOtp(otp.slice(0, Math.max(0, i - 1))); focus(i - 1); }
              if (e.key === "ArrowLeft") focus(i - 1);
              if (e.key === "ArrowRight") focus(i + 1);
            }}
            className={cn("h-14 min-w-0 flex-1 rounded-lg border-2 bg-surface-sunken text-center font-display text-2xl font-extrabold outline-none transition-colors focus:border-line-strong focus:bg-surface", d ? "border-primary bg-primary-soft" : "border-line", error && "border-danger")}
          />
        ))}
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-danger-text">{error}</p>}
      {note && <p className="text-sm text-fg-muted">{note}</p>}
      {left > 0 ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-fg-muted"><Icon name="clock" size={16} />Resend code in 0:{String(left).padStart(2, "0")}</p>
      ) : (
        <button type="button" onClick={resend} className="pressable inline-flex min-h-11 items-center gap-2 self-start text-sm font-extrabold underline underline-offset-4"><Icon name="history" size={16} />Resend code</button>
      )}
      <Cta type="submit">Verify</Cta>
    </form>
  );
}
