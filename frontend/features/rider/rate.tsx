"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { useDialog } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { Avatar, Chip, EmptyState } from "@/components/ui/primitives";
import { useTrip } from "@/lib/hooks/use-trip";
import { formatNaira } from "@/lib/format";
import { useBooking } from "@/lib/store/booking";
import { cn } from "@/lib/cn";
import { ReportSheet } from "./report-sheet";

const GOOD_TAGS = ["Punctual", "Clean car", "Safe driving", "Friendly", "Fair price"];
const ISSUE_TAGS = ["Driver was late", "Unsafe driving", "Couldn’t find the pickup", "Vehicle issue", "Other"];
const TIPS = [0, 100, 200, 500];

export function RateRide({ id }: { id: string }) {
  const router = useRouter();
  const b = useBooking((s) => s.bookings.find((x) => x.id === id));
  const balance = useBooking((s) => s.balance);
  const rate = useBooking((s) => s.rate);
  const report = useDialog();
  // Starts EMPTY: no prefilled stars or tags, so the rating is the rider's own.
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tip, setTip] = useState(0);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const { driver } = useTrip(b?.tripId);
  if (!b) return <EmptyState title="Nothing to rate" body="We can’t find that trip." action={<ButtonLink href="/app/trips">My trips</ButtonLink>} />;
  const first = (driver?.name ?? "your driver").split(" ")[0];
  const low = stars > 0 && stars <= 3;
  const options = low ? ISSUE_TAGS : GOOD_TAGS;

  const pickStars = (n: number) => { setStars(n); setTags([]); };

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Rate your ride" back={`/app/booking/${b.id}`} />
      <form className="grid place-items-center gap-6 text-center" onSubmit={async (e) => { e.preventDefault(); if (!stars || saving) return; setSaving(true); setErr(""); const r = await rate(b.id, { stars, tags, tip }); setSaving(false); if (r.ok) router.push("/app/trips"); else setErr(r.message); }}>
        <Avatar name={driver?.name ?? "MYWAY"} size={88} />
        <h2 className="text-display-md">How was your ride with {first}?</h2>
        <div role="radiogroup" aria-label="Star rating" className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => pickStars(n)} className="pressable grid size-12 place-items-center rounded-full">
              <Icon name="star" size={40} strokeWidth={2} className={cn("transition-colors duration-150", n <= stars ? "fill-primary text-outline" : "text-fg-disabled")} />
            </button>
          ))}
        </div>
        {stars > 0 && (
          <div className="grid w-full gap-3">
            <p className="text-sm font-bold text-fg-secondary">{low ? "What went wrong?" : "What went well?"}</p>
            <div className="flex flex-wrap justify-center gap-2" role="group" aria-label={low ? "What went wrong" : "What went well"}>
              {options.map((t) => <Chip key={t} active={tags.includes(t)} onClick={() => setTags((v) => (v.includes(t) ? v.filter((x) => x !== t) : [...v, t]))}>{t}</Chip>)}
            </div>
            {low && <Button type="button" variant="outline" icon="flag" onClick={report.open}>Report a problem</Button>}
          </div>
        )}
        {stars > 3 && (
          <div className="w-full space-y-2"><p className="text-sm font-bold text-fg-secondary">Add a tip for {first}? (optional)</p>
            <div className="flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Tip">
              {TIPS.map((t) => <Chip key={t} role="radio" aria-checked={tip === t} active={tip === t} disabled={t > balance} onClick={() => setTip(t)}>{t === 0 ? "No tip" : formatNaira(t)}</Chip>)}
            </div>
          </div>
        )}
        <label className="block w-full text-left"><span className="sr-only">Tell us more</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Tell us more (optional)" className="w-full resize-none rounded-lg border-2 border-line bg-surface-sunken p-4 outline-none transition-colors focus:border-line-strong focus:bg-surface" />
        </label>
        {err && <p role="alert" className="w-full text-left text-sm font-semibold text-danger-text">{err}</p>}
        <Button type="submit" size="lg" full disabled={!stars || saving}>{saving ? "Sending…" : stars ? "Submit rating" : "Choose a star rating"}</Button>
      </form>
      <ReportSheet dialogRef={report.ref} bookingId={b.id} defaultCategory={tags.includes("Unsafe driving") ? "Unsafe driving" : "Other"} />
    </div>
  );
}
