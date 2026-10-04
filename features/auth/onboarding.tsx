"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/illustrations/brand";
import { CarArt, Danfo, ShieldArt } from "@/components/illustrations/vehicles";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { Banner } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icon";
import { useCountdown } from "@/lib/hooks/use-countdown";
import { useHydrated } from "@/lib/store/hydrate";
import { useSession } from "@/lib/store/session";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/cn";

type Step = "role" | "phone" | "otp" | "id" | "location";
const ORDER: Step[] = ["role", "phone", "otp", "id", "location"];
const HOME: Record<Role, string> = { rider: "/app", driver: "/drive", operator: "/operator" };

const ROLES: { id: Role; icon: IconName; title: string; body: string }[] = [
  { id: "rider", icon: "user", title: "I’m a passenger", body: "Book seats in shared cars and scheduled buses." },
  { id: "driver", icon: "car", title: "I’m a driver", body: "Post trips, fill every seat, get paid daily." },
  { id: "operator", icon: "bus", title: "I run a bus company", body: "List routes, manage your fleet and seats sold." },
];

export function Onboarding() {
  const router = useRouter();
  const ready = useHydrated();
  const { setProfile, completeOnboarding, onboarded, role: savedRole } = useSession();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role>("rider");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [nin, setNin] = useState("");
  const [selfie, setSelfie] = useState(false);
  const [error, setError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const idx = ORDER.indexOf(step);

  useEffect(() => {
    if (ready && onboarded && savedRole) router.replace(HOME[savedRole]);
  }, [ready, onboarded, savedRole, router]);

  // Move focus to the new step heading so keyboard and screen-reader users keep their place.
  useEffect(() => { headingRef.current?.focus(); }, [step]);

  const go = (s: Step) => { setError(""); setStep(s); };
  const back = () => go(ORDER[Math.max(0, idx - 1)]!);

  const submitPhone = () => {
    const digits = phone.replace(/\D/g, "").replace(/^0/, "");
    if (!/^[789]\d{9}$/.test(digits)) return setError("Enter a Nigerian mobile number with 10 digits after +234, for example 803 123 4567.");
    setProfile({ phone: `+234${digits}` });
    go("otp");
  };
  const submitOtp = () => {
    if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit code we sent. In this demo, any 6 digits work.");
    go("id");
  };
  const submitId = () => {
    if (!/^\d{11}$/.test(nin.replace(/\s/g, ""))) return setError("A NIN has 11 digits. Check the number on your NIN slip and try again.");
    if (!selfie) return setError("Take a quick selfie so we can match it to your ID.");
    setProfile({ verified: true });
    go("location");
  };
  const finish = () => {
    setProfile({ role });
    completeOnboarding();
    router.push(HOME[role]);
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      {/* Brand panel (desktop) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-fg lg:flex">
        <Link href="/" aria-label="MYWAY home"><Logo /></Link>
        <div className="space-y-6">
          <h2 className="text-display-lg">Board once.<br />Arrive on time.</h2>
          <p className="max-w-md text-body-lg font-medium text-primary-fg/80">Every driver and rider on MYWAY is verified. It takes about two minutes.</p>
        </div>
        <div>
          {step === "id" ? <ShieldArt className="mx-auto mb-6 w-40" /> : step === "role" || step === "location" ? <Danfo className="w-full max-w-md" /> : <CarArt className="w-full max-w-sm" />}
        </div>
        <div className="stripe-band absolute inset-x-0 bottom-0" aria-hidden="true" />
      </aside>

      <main id="main" className="flex flex-col px-[var(--page-gutter)] pb-10 pt-5">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          <div className="mb-8 flex items-center gap-3">
            {idx > 0 ? (
              <button type="button" onClick={back} aria-label="Go back" className="pressable grid size-11 place-items-center rounded-full border-2 border-line bg-surface hover:bg-surface-sunken"><Icon name="arrowL" size={20} /></button>
            ) : (
              <Link href="/" aria-label="Back to the homepage" className="pressable grid size-11 place-items-center rounded-full border-2 border-line bg-surface hover:bg-surface-sunken lg:hidden"><Icon name="arrowL" size={20} /></Link>
            )}
            <div className="flex flex-1 gap-1.5" role="progressbar" aria-label="Sign-up progress" aria-valuemin={1} aria-valuemax={ORDER.length} aria-valuenow={idx + 1}>
              {ORDER.map((s, i) => <span key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", i <= idx ? "bg-secondary" : "bg-line")} />)}
            </div>
          </div>

          <div key={step} className="animate-rise flex flex-1 flex-col gap-6">
            {step === "role" && (
              <>
                <Heading ref={headingRef} title="How do you want to move?" body="You can switch between apps any time." />
                <div role="radiogroup" aria-label="Choose your role" className="grid gap-3">
                  {ROLES.map((r) => {
                    const on = role === r.id;
                    return (
                      <button key={r.id} type="button" role="radio" aria-checked={on} onClick={() => setRole(r.id)} className={cn("pressable flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors duration-150", on ? "border-outline bg-primary text-primary-fg shadow-hard" : "border-line bg-surface hover:bg-surface-sunken")}>
                        <span className={cn("grid size-14 shrink-0 place-items-center rounded-[1rem]", on ? "bg-secondary text-primary" : "bg-surface-sunken")}><Icon name={r.icon} size={26} /></span>
                        <span className="flex-1"><span className="block font-display text-xl font-extrabold">{r.title}</span><span className={cn("block text-sm", on ? "text-primary-fg/80" : "text-fg-muted")}>{r.body}</span></span>
                        <span className={cn("grid size-7 place-items-center rounded-full", on ? "bg-secondary text-primary" : "border-2 border-fg-disabled")}>{on && <Icon name="check" size={16} strokeWidth={3.5} />}</span>
                      </button>
                    );
                  })}
                </div>
                <Cta onClick={() => go("phone")}>Continue</Cta>
              </>
            )}

            {step === "phone" && (
              <form className="flex flex-1 flex-col gap-6" onSubmit={(e) => { e.preventDefault(); submitPhone(); }}>
                <Heading ref={headingRef} title="What’s your number?" body="We’ll text a 6-digit code. Everyone on MYWAY is verified, riders and drivers." />
                <Field label="Mobile number" inputMode="tel" autoComplete="tel-national" placeholder="803 123 4567" value={phone} onChange={(e) => { setPhone(e.target.value); setError(""); }} error={error} icon="phone" trailing={<span className="text-sm font-bold text-fg-muted">+234</span>} />
                <p className="text-sm text-fg-muted">By continuing you agree to our Terms and Privacy Policy.</p>
                <Cta type="submit">Send code</Cta>
              </form>
            )}

            {step === "otp" && <OtpStep headingRef={headingRef} phone={phone} otp={otp} setOtp={(v) => { setOtp(v); setError(""); }} error={error} onSubmit={submitOtp} />}

            {step === "id" && (
              <form className="flex flex-1 flex-col gap-5" onSubmit={(e) => { e.preventDefault(); submitId(); }}>
                <Heading ref={headingRef} title="Let’s confirm it’s you" body="Every rider and driver is ID-verified, so every seat is safe." />
                <Field label="NIN · 11 digits" inputMode="numeric" maxLength={13} placeholder="Enter your NIN" value={nin} onChange={(e) => { setNin(e.target.value); setError(""); }} icon="badge" error={error.includes("NIN") ? error : undefined} />
                <button type="button" onClick={() => { setSelfie(true); setError(""); }} aria-pressed={selfie} className={cn("pressable flex items-center gap-4 rounded-xl border-2 p-4 text-left", selfie ? "border-success bg-success-soft" : "border-line-strong bg-surface hover:bg-surface-sunken")}>
                  <span className="grid size-14 place-items-center rounded-full border-2 border-outline bg-surface"><Icon name={selfie ? "check" : "camera"} size={26} strokeWidth={selfie ? 3 : 2} className={selfie ? "text-success" : undefined} /></span>
                  <span className="flex-1"><span className="block font-bold">{selfie ? "Selfie captured" : "Take a quick selfie"}</span><span className="block text-sm text-fg-muted">{selfie ? "Looks good. Tap to retake." : "Good light, no sunglasses."}</span></span>
                </button>
                {error && !error.includes("NIN") && <Banner tone="danger" icon="alert">{error}</Banner>}
                <Banner tone="success" icon="lock">Your ID is only used to verify you. It is never shown to drivers or riders. (Demo: nothing is sent anywhere.)</Banner>
                <Cta type="submit">Verify me</Cta>
              </form>
            )}

            {step === "location" && (
              <>
                <Heading ref={headingRef} title="Find rides near you" body="Allow location so we can show the closest stops and live cars." />
                <ul className="grid gap-4">
                  {([["pin", "See pickup stops and cars around you"], ["nav", "Track your driver or bus live"], ["shield", "Share your trip with people you trust"]] as [IconName, string][]).map(([ic, t]) => (
                    <li key={t} className="flex items-center gap-3 font-semibold"><span className="grid size-10 place-items-center rounded-[0.75rem] bg-primary-soft"><Icon name={ic} size={20} /></span>{t}</li>
                  ))}
                </ul>
                <div className="mt-auto grid gap-3">
                  <Cta onClick={finish} icon="pin">Allow location</Cta>
                  <Button variant="ghost" size="lg" full onClick={finish}>Not now</Button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const Heading = forwardRef<HTMLHeadingElement, { title: string; body: string }>(function Heading({ title, body }, ref) {
  return (
    <div className="space-y-2">
      <h1 ref={ref} tabIndex={-1} className="text-display-md outline-none">{title}</h1>
      <p className="text-fg-muted">{body}</p>
    </div>
  );
});

function Cta({ children, ...rest }: React.ComponentProps<typeof Button>) {
  return <Button size="lg" full iconRight={rest.icon ? undefined : "arrowR"} className="mt-auto" {...rest}>{children}</Button>;
}

function OtpStep({ headingRef, phone, otp, setOtp, error, onSubmit }: { headingRef: React.RefObject<HTMLHeadingElement | null>; phone: string; otp: string; setOtp: (v: string) => void; error: string; onSubmit: () => void }) {
  const left = useCountdown(24);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => otp[i] ?? "");
  const set = (i: number, v: string) => {
    const d = v.replace(/\D/g, "");
    if (!d) return;
    const next = (otp.slice(0, i) + d).slice(0, 6);
    setOtp(next);
    inputs.current[Math.min(next.length, 5)]?.focus();
  };
  return (
    <form className="flex flex-1 flex-col gap-6" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <div className="space-y-2">
        <h1 ref={headingRef} tabIndex={-1} className="text-display-md outline-none">Enter the code</h1>
        <p className="text-fg-muted">Sent to +234 {phone.replace(/\D/g, "").replace(/^0/, "")}</p>
      </div>
      <div className="flex gap-2" role="group" aria-label="6-digit code">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={6}
            aria-label={`Digit ${i + 1}`}
            value={d}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => { if (e.key === "Backspace" && !d) { setOtp(otp.slice(0, Math.max(0, i - 1))); inputs.current[Math.max(0, i - 1)]?.focus(); } }}
            className={cn("h-16 min-w-0 flex-1 rounded-lg border-2 bg-surface-sunken text-center font-display text-3xl font-extrabold outline-none transition-colors focus:border-line-strong focus:bg-surface", d ? "border-primary bg-primary-soft" : "border-line", error && "border-danger")}
          />
        ))}
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-danger-text">{error}</p>}
      <p className="flex items-center gap-2 text-sm font-semibold text-fg-muted"><Icon name="clock" size={16} />{left > 0 ? `Resend code in 0:${String(left).padStart(2, "0")}` : "You can request a new code now"}</p>
      <Cta type="submit">Verify</Cta>
    </form>
  );
}
