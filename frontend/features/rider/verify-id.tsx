"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, Field } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Banner } from "@/components/ui/primitives";
import { DEMO } from "@/lib/demo";
import { digitsOnly } from "@/lib/input";
import { useSession } from "@/lib/store/session";
import { LIVE } from "@/lib/api/live";
import { ApiError } from "@/lib/api/client";
import { submitNin } from "@/lib/api/auth";
import { cn } from "@/lib/cn";

const NIN_LEN = 11;

/**
 * Riders browse freely; their ID is confirmed at their FIRST BOOKING (roadmap Phase 2).
 * Drivers and operators verify up front during sign-up instead.
 */
export function VerifyIdSheet({ dialogRef, onVerified }: { dialogRef: React.RefObject<HTMLDialogElement | null>; onVerified: () => void }) {
  const verifyId = useSession((s) => s.verifyId);
  const [nin, setNin] = useState("");
  const [selfie, setSelfie] = useState(false);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (nin.length !== NIN_LEN) return setErr(`A NIN has ${NIN_LEN} digits. You’ve entered ${nin.length}.`);
    if (!selfie) return setErr("Take a quick selfie so we can match it to your ID.");
    if (LIVE) {
      setSaving(true);
      try { await submitNin(nin); } catch (e) { setSaving(false); return setErr(e instanceof ApiError ? e.message : "Something went wrong. Try again."); }
      setSaving(false);
    }
    verifyId();
    dialogRef.current?.close();
    onVerified();
  };

  return (
    <Dialog dialogRef={dialogRef} title="Confirm it’s you to reserve your seat">
      <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <p className="text-fg-muted">Everyone riding or driving with MYWAY is ID-verified. You only do this once.</p>
        <Field label="NIN" inputMode="numeric" autoComplete="off" maxLength={NIN_LEN} placeholder="11 digits" icon="badge" value={nin} onChange={(e) => { setNin(digitsOnly(e.target.value, NIN_LEN)); setErr(""); }} trailing={<span className="text-sm font-bold tabular-nums text-fg-muted">{nin.length}/{NIN_LEN}</span>} />
        <button type="button" onClick={() => { setSelfie(true); setErr(""); }} aria-pressed={selfie} className={cn("pressable flex min-h-16 items-center gap-3.5 rounded-xl border-2 p-3.5 text-left", selfie ? "border-success bg-success-soft" : "border-line-strong bg-surface hover:bg-surface-sunken")}>
          <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-outline bg-surface"><Icon name={selfie ? "check" : "camera"} size={24} strokeWidth={selfie ? 3 : 2} className={selfie ? "text-success" : undefined} /></span>
          <span className="min-w-0 flex-1"><span className="block font-bold">{selfie ? "Selfie captured" : "Take a quick selfie"}</span><span className="block text-sm text-fg-muted">{selfie ? "Looks good. Tap to retake." : "Good light, no sunglasses."}</span></span>
        </button>
        {err && <Banner tone="danger" icon="alert">{err}</Banner>}
        <Banner tone="success" icon="lock">Your ID is only used to verify you. Drivers and other riders never see it.{DEMO && !LIVE && " (Demo: nothing is sent anywhere.)"}</Banner>
        <Button type="submit" size="lg" full disabled={saving}>{saving ? "Checking…" : "Confirm and continue"}</Button>
      </form>
    </Dialog>
  );
}
