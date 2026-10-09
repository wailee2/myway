"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { Banner } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icon";
import { digitsOnly, nationalPhone } from "@/lib/input";
import { DEMO, DEMO_OTP_NOTE } from "@/lib/demo";
import { useHydrated } from "@/lib/store/hydrate";
import { useSession } from "@/lib/store/session";
import { LIVE } from "@/lib/api/live";
import { ApiError, setToken } from "@/lib/api/client";
import { requestOtp, submitNin, verifyOtp, isNewAccount, type ApiUser } from "@/lib/api/auth";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/cn";
import { checkPhone, Cta, Heading, OtpStep, PhoneStep } from "./steps";

type Step = "role" | "phone" | "otp" | "name" | "id" | "location";
/** Riders browse first and verify their ID at their first booking; drivers and operators verify up front. */
const stepsFor = (role: Role): Step[] => (role === "rider" ? ["role", "phone", "otp", "name", "location"] : ["role", "phone", "otp", "id", "location"]);
const HOME: Record<Role, string> = { rider: "/app", driver: "/drive", operator: "/operator" };
const NIN_LEN = 11;

const ROLES: { id: Role; icon: IconName; title: string; body: string }[] = [
  { id: "rider", icon: "user", title: "I’m a passenger", body: "Find someone already going your way." },
  { id: "driver", icon: "car", title: "I’m a driver", body: "Post trips, fill every seat, get paid daily." },
  { id: "operator", icon: "bus", title: "I run a bus company", body: "List routes, manage your fleet and seats sold." },
];

/** Sign-up: role, phone, code, ID, location. Existing users go to /login instead. */
export function Onboarding() {
  const router = useRouter();
  const ready = useHydrated();
  const register = useSession((s) => s.register);
  const signInWith = useSession((s) => s.signInWith);
  const hasAccount = useSession((s) => s.hasAccount);
  const onboarded = useSession((s) => s.onboarded);
  const savedRole = useSession((s) => s.role);
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role>("rider");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [nin, setNin] = useState("");
  const [selfie, setSelfie] = useState(false);
  const [error, setError] = useState("");
  /** Server errors (shown in a banner; they can contain colons, unlike the field errors above). */
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const busy = useRef(false);
  /** The account the server created, held until the last step so the "already signed in" redirect doesn't skip location. */
  const created = useRef<ApiUser | null>(null);
  const ORDER = stepsFor(role);
  const idx = ORDER.indexOf(step);

  // Already signed in? Skip sign-up.
  useEffect(() => {
    if (ready && onboarded && savedRole) router.replace(HOME[savedRole]);
  }, [ready, onboarded, savedRole, router]);

  // Move focus to the new step heading so keyboard and screen-reader users keep their place.
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [step]);

  const go = (s: Step) => {
    setError("");
    setServerError("");
    setStep(s);
    document.getElementById("screen-scroll")?.scrollTo({ top: 0, behavior: "instant" });
  };
  const back = () => go(ORDER[Math.max(0, idx - 1)]!);

  const msg = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong. Try again.");
  /** Runs one server call at a time; a second tap (or the OTP box auto-submitting) while one is running is ignored. */
  const once = async (fn: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    try { await fn(); } finally { busy.current = false; setSaving(false); }
  };

  const submitPhone = () => {
    const bad = checkPhone(phone);
    if (bad) return setError(bad);
    if (!LIVE) {
      if (hasAccount(nationalPhone(phone)!)) return setError("That number already has an account. Log in instead.");
      return go("otp");
    }
    void once(async () => {
      try { await requestOtp(nationalPhone(phone)!); go("otp"); } catch (e) { setError(msg(e)); }
    });
  };
  const submitOtp = () => {
    if (!/^\d{6}$/.test(otp)) return setError("Enter all 6 digits of the code we sent.");
    if (!LIVE) return go(role === "rider" ? "name" : "id");
    // Check the code now (without a name, so no account is made yet): a new number answers "new_account", an existing one logs in.
    void once(async () => {
      try {
        await verifyOtp({ phone: nationalPhone(phone)!, code: otp });
        setError("That number already has an account. Log in instead.");
      } catch (e) {
        if (isNewAccount(e)) go(role === "rider" ? "name" : "id");
        else setError(msg(e));
      }
    });
  };
  /** Creates the account on the server (once), then optionally confirms the NIN. Returns false if it failed. */
  const createAccount = async (withNin: boolean) => {
    try {
      if (!created.current) {
        const { token, user } = await verifyOtp({ phone: nationalPhone(phone)!, code: otp, name: name.trim(), role });
        setToken(token);
        created.current = user;
      }
      if (withNin && !created.current.id_verified) created.current = await submitNin(nin);
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.code === "INVALID_OTP") { setOtp(""); go("otp"); setError("That code has expired. Request a new one."); }
      else setServerError(msg(e));
      return false;
    }
  };
  const submitName = () => {
    if (name.trim().length < 2) return setError("name:Enter your name so drivers know who to look for.");
    if (!LIVE) return go("location");
    void once(async () => { if (await createAccount(false)) go("location"); });
  };
  const submitId = () => {
    if (name.trim().length < 2) return setError(role === "operator" ? "name:Enter your company name." : "name:Enter your full name as it appears on your NIN.");
    if (nin.length !== NIN_LEN) return setError(`nin:A NIN has ${NIN_LEN} digits. You’ve entered ${nin.length}.`);
    if (!selfie) return setError("Take a quick selfie so we can match it to your ID.");
    if (!LIVE) return go("location");
    void once(async () => { if (await createAccount(true)) go("location"); });
  };
  const finish = () => {
    if (LIVE && created.current) signInWith(created.current);
    else register({ name: name.trim(), phone: nationalPhone(phone) ?? digitsOnly(phone, 10), role, idVerified: role !== "rider" });
    router.replace(HOME[role]);
  };

  const fieldError = (key: string) => (error.startsWith(`${key}:`) ? error.slice(key.length + 1) : undefined);
  const bannerError = error && !error.includes(":") ? error : "";

  return (
    <main id="main" className="flex min-h-dvh flex-col px-[var(--page-gutter)] pb-8 pt-4">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="mb-6 flex items-center gap-3">
          {idx > 0 ? (
            <button type="button" onClick={back} aria-label="Go back" className="pressable grid size-11 place-items-center rounded-full border-2 border-line bg-surface hover:bg-surface-sunken"><Icon name="arrowL" size={20} /></button>
          ) : (
            <Link href="/" aria-label="Back" className="pressable grid size-11 place-items-center rounded-full border-2 border-line bg-surface hover:bg-surface-sunken"><Icon name="arrowL" size={20} /></Link>
          )}
          <div className="flex flex-1 gap-1.5" role="progressbar" aria-label="Sign-up progress" aria-valuemin={1} aria-valuemax={ORDER.length} aria-valuenow={idx + 1}>
            {ORDER.map((s, i) => <span key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", i <= idx ? "bg-secondary" : "bg-line")} />)}
          </div>
        </div>

        <div key={step} className="animate-rise flex flex-1 flex-col gap-6">
          {step === "role" && (
            <>
              <Heading ref={headingRef} title="How do you want to move?" body="Pick the one that fits. You can open another account with a different number any time." />
              <div role="radiogroup" aria-label="Choose your role" className="grid gap-3">
                {ROLES.map((r) => {
                  const on = role === r.id;
                  return (
                    <button key={r.id} type="button" role="radio" aria-checked={on} onClick={() => setRole(r.id)} className={cn("pressable flex items-center gap-3.5 rounded-xl border-2 p-3.5 text-left transition-colors duration-150", on ? "border-outline bg-primary text-primary-fg shadow-hard" : "border-line bg-surface hover:bg-surface-sunken")}>
                      <span className={cn("grid size-12 shrink-0 place-items-center rounded-[0.875rem]", on ? "bg-secondary text-primary" : "bg-surface-sunken")}><Icon name={r.icon} size={24} /></span>
                      <span className="min-w-0 flex-1"><span className="block font-display text-lg font-extrabold leading-tight">{r.title}</span><span className={cn("block text-sm", on ? "text-primary-fg/80" : "text-fg-muted")}>{r.body}</span></span>
                      <span className={cn("grid size-6 shrink-0 place-items-center rounded-full", on ? "bg-secondary text-primary" : "border-2 border-fg-disabled")}>{on && <Icon name="check" size={14} strokeWidth={3.5} />}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-auto grid gap-4">
                <Cta onClick={() => go("phone")}>Continue</Cta>
                <p className="text-center text-sm font-semibold text-fg-muted">Already have an account? <Link href="/login" className="font-extrabold text-fg underline underline-offset-4">Log in</Link></p>
              </div>
            </>
          )}

          {step === "phone" && (
            <PhoneStep headingRef={headingRef} title="What’s your number?" body="We’ll text a 6-digit code. Everyone on MYWAY is verified, riders and drivers." phone={phone} setPhone={(v) => { setPhone(v); setError(""); }} error={error} onSubmit={submitPhone} cta="Send code" footer={<p className="text-center text-sm font-semibold text-fg-muted">Already registered? <Link href="/login" className="font-extrabold text-fg underline underline-offset-4">Log in</Link></p>} />
          )}

          {step === "otp" && <OtpStep headingRef={headingRef} phone={phone} otp={otp} setOtp={(v) => { setOtp(v); setError(""); }} error={error} onSubmit={submitOtp} note={DEMO ? DEMO_OTP_NOTE : undefined} />}

          {step === "name" && (
            <form className="flex flex-1 flex-col gap-5" onSubmit={(e) => { e.preventDefault(); submitName(); }}>
              <Heading ref={headingRef} title="What should we call you?" body="You can look around right away. We’ll ask you to confirm your ID once, when you reserve your first seat." />
              <Field label="Your name" autoComplete="name" maxLength={40} placeholder="e.g. Amina" value={name} onChange={(e) => { setName(e.target.value); setError(""); setServerError(""); }} icon="user" error={fieldError("name")} />
              {serverError && <Banner tone="danger" icon="alert">{serverError}</Banner>}
              <Cta type="submit" disabled={saving}>{saving ? "Creating your account…" : "Continue"}</Cta>
            </form>
          )}

          {step === "id" && (
            <form className="flex flex-1 flex-col gap-5" onSubmit={(e) => { e.preventDefault(); submitId(); }}>
              <Heading ref={headingRef} title="Let’s confirm it’s you" body="Every rider and driver is ID-verified, so every seat is safe." />
              <Field label={role === "operator" ? "Company name" : "Full name"} autoComplete="name" maxLength={40} placeholder={role === "operator" ? "e.g. Cityline Coaches" : "As on your NIN"} value={name} onChange={(e) => { setName(e.target.value); setError(""); }} icon="user" error={fieldError("name")} />
              <Field
                label="NIN"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={NIN_LEN}
                autoComplete="off"
                placeholder="11 digits"
                value={nin}
                onChange={(e) => { setNin(digitsOnly(e.target.value, NIN_LEN)); setError(""); }}
                icon="badge"
                error={fieldError("nin")}
                trailing={<span className="text-sm font-bold tabular-nums text-fg-muted">{nin.length}/{NIN_LEN}</span>}
              />
              <button type="button" onClick={() => { setSelfie(true); setError(""); }} aria-pressed={selfie} className={cn("pressable flex items-center gap-3.5 rounded-xl border-2 p-3.5 text-left", selfie ? "border-success bg-success-soft" : "border-line-strong bg-surface hover:bg-surface-sunken")}>
                <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-outline bg-surface"><Icon name={selfie ? "check" : "camera"} size={24} strokeWidth={selfie ? 3 : 2} className={selfie ? "text-success" : undefined} /></span>
                <span className="min-w-0 flex-1"><span className="block font-bold">{selfie ? "Selfie captured" : "Take a quick selfie"}</span><span className="block text-sm text-fg-muted">{selfie ? "Looks good. Tap to retake." : "Good light, no sunglasses."}</span></span>
              </button>
              {(bannerError || serverError) && <Banner tone="danger" icon="alert">{serverError || bannerError}</Banner>}
              <Banner tone="success" icon="lock">Your ID is only used to verify you. It is never shown to drivers or riders.{DEMO && !LIVE && " (Demo: nothing is sent anywhere.)"}</Banner>
              <Cta type="submit" disabled={saving}>{saving ? "Verifying…" : "Verify me"}</Cta>
            </form>
          )}

          {step === "location" && (
            <>
              <Heading ref={headingRef} title="Find rides near you" body="Allow location so we can show the stops closest to you." />
              <ul className="grid gap-4">
                {([["pin", "See pickup stops near you"], ["nav", "Track your driver on the way"], ["shield", "Share your trip with people you trust"]] as [IconName, string][]).map(([ic, t]) => (
                  <li key={t} className="flex items-center gap-3 font-semibold"><span className="grid size-10 shrink-0 place-items-center rounded-[0.75rem] bg-primary-soft"><Icon name={ic} size={20} /></span><span className="min-w-0 flex-1">{t}</span></li>
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
  );
}
