"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { formatPhone, nationalPhone } from "@/lib/input";
import { useHydrated } from "@/lib/store/hydrate";
import { DEMO_ACCOUNTS, useSession } from "@/lib/store/session";
import type { Role } from "@/lib/types";
import { checkPhone, OtpStep, PhoneStep } from "./steps";

const HOME: Record<Role, string> = { rider: "/app", driver: "/drive", operator: "/operator" };
const DEMO_LABEL: Record<Role, { label: string; icon: IconName }> = {
  rider: { label: "Passenger", icon: "user" },
  driver: { label: "Driver", icon: "car" },
  operator: { label: "Bus operator", icon: "bus" },
};

/** Log in for existing users: phone, then code. New users go to /get-started. */
export function Login() {
  const router = useRouter();
  const ready = useHydrated();
  const login = useSession((s) => s.login);
  const hasAccount = useSession((s) => s.hasAccount);
  const onboarded = useSession((s) => s.onboarded);
  const savedRole = useSession((s) => s.role);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (ready && onboarded && savedRole) router.replace(HOME[savedRole]);
  }, [ready, onboarded, savedRole, router]);
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [step]);

  const submitPhone = () => {
    const bad = checkPhone(phone);
    if (bad) return setError(bad);
    if (!hasAccount(nationalPhone(phone)!)) return setError("We couldn’t find an account with that number. Check it, or create an account.");
    setError("");
    setStep("otp");
  };
  const submitOtp = () => {
    if (!/^\d{6}$/.test(otp)) return setError("Enter all 6 digits of the code we sent.");
    const role = login(nationalPhone(phone)!);
    if (!role) return setError("We couldn’t find that account. Go back and check the number.");
    router.replace(HOME[role]);
  };
  const useDemo = (p: string) => { setPhone(p); setOtp(""); setError(""); setStep("otp"); };

  return (
    <main id="main" className="flex min-h-dvh flex-col px-[var(--page-gutter)] pb-8 pt-4">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="mb-6 flex items-center">
          {step === "otp" ? (
            <button type="button" onClick={() => { setError(""); setStep("phone"); }} aria-label="Go back" className="pressable grid size-11 place-items-center rounded-full border-2 border-line bg-surface hover:bg-surface-sunken"><Icon name="arrowL" size={20} /></button>
          ) : (
            <Link href="/" aria-label="Back" className="pressable grid size-11 place-items-center rounded-full border-2 border-line bg-surface hover:bg-surface-sunken"><Icon name="arrowL" size={20} /></Link>
          )}
        </div>

        <div key={step} className="animate-rise flex flex-1 flex-col gap-6">
          {step === "phone" ? (
            <PhoneStep
              headingRef={headingRef}
              title="Welcome back"
              body="Enter your number and we’ll text you a 6-digit code."
              phone={phone}
              setPhone={(v) => { setPhone(v); setError(""); }}
              error={error}
              onSubmit={submitPhone}
              cta="Send code"
              footer={
                <div className="grid gap-5">
                  <p className="text-center text-sm font-semibold text-fg-muted">New to MYWAY? <Link href="/get-started" className="font-extrabold text-fg underline underline-offset-4">Create an account</Link></p>
                  <section aria-label="Demo accounts" className="rounded-xl border-2 border-dashed border-line-strong p-3.5">
                    <p className="mb-2.5 text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Demo accounts · tap to sign in</p>
                    <div className="grid grid-cols-3 gap-2">
                      {DEMO_ACCOUNTS.map((a) => (
                        <button key={a.phone} type="button" onClick={() => useDemo(a.phone)} title={formatPhone(a.phone)} className="pressable flex flex-col items-center gap-1.5 rounded-lg border-2 border-line bg-surface px-1 py-3 text-sm font-bold transition-colors hover:bg-surface-sunken">
                          <Icon name={DEMO_LABEL[a.role].icon} size={22} />{DEMO_LABEL[a.role].label}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              }
            />
          ) : (
            <OtpStep headingRef={headingRef} phone={phone} otp={otp} setOtp={(v) => { setOtp(v); setError(""); }} error={error} onSubmit={submitOtp} note="Demo: any 6 digits will work." />
          )}
        </div>
      </div>
    </main>
  );
}
