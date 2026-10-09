"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, RadioCard } from "@/components/ui/form";
import { Banner } from "@/components/ui/primitives";
import { REPORT_CATEGORIES, useSafety, type ReportCategory } from "@/lib/store/safety";

/** "Report a problem" that goes somewhere real: it files a report with a reference the rider can quote to support. */
export function ReportSheet({ dialogRef, bookingId, defaultCategory }: { dialogRef: React.RefObject<HTMLDialogElement | null>; bookingId?: string; defaultCategory?: ReportCategory }) {
  const report = useSafety((s) => s.report);
  const [category, setCategory] = useState<ReportCategory>(defaultCategory ?? "Other");
  const [details, setDetails] = useState("");
  const [ref, setRef] = useState<string | null>(null);

  const submit = () => { setRef(report({ bookingId, category, details: details.trim() }).ref); };
  const close = () => { dialogRef.current?.close(); };

  return (
    <Dialog dialogRef={dialogRef} title="Report a problem" onClosed={() => { setRef(null); setDetails(""); }}>
      {ref ? (
        <div className="grid gap-4">
          <Banner tone="success" icon="check"><p className="font-extrabold">Report {ref} received</p><p>The MYWAY support team will review it and contact you on your phone number. Quote {ref} if you call us.</p></Banner>
          <Button size="lg" full onClick={close}>Done</Button>
        </div>
      ) : (
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <div className="grid gap-2" role="radiogroup" aria-label="What went wrong?">
            {REPORT_CATEGORIES.map((c) => <div key={c} className="relative"><RadioCard name="report" checked={category === c} onSelect={() => setCategory(c)} title={c} /></div>)}
          </div>
          <label className="block"><span className="sr-only">Tell us what happened</span>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="Tell us what happened (optional)" className="w-full resize-none rounded-lg border-2 border-line bg-surface-sunken p-4 outline-none focus:border-line-strong focus:bg-surface" />
          </label>
          <p className="text-sm text-fg-muted">In an emergency, use SOS or call 112 instead.</p>
          <Button type="submit" size="lg" full>Send report</Button>
        </form>
      )}
    </Dialog>
  );
}
