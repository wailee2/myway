"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Avatar, Chip, EmptyState } from "@/components/ui/primitives";
import { getDriver, getTrip } from "@/lib/data/trips";
import { useBooking } from "@/lib/store/booking";
import { cn } from "@/lib/cn";

const TAGS = ["Punctual", "Clean car", "Safe driving", "Friendly", "Fair price"];
const TIPS = ["No tip", "₦100", "₦200", "₦500"];

export function RateRide({ id }: { id: string }) {
  const router = useRouter();
  const b = useBooking((s) => s.bookings.find((x) => x.id === id));
  const rate = useBooking((s) => s.rate);
  const [stars, setStars] = useState(5);
  const [tags, setTags] = useState<string[]>(["Punctual"]);
  const [tip, setTip] = useState("No tip");
  const [note, setNote] = useState("");
  if (!b) return <EmptyState title="Nothing to rate" body="We can’t find that trip." action={<ButtonLink href="/app/trips">My trips</ButtonLink>} />;
  const trip = getTrip(b.tripId ?? "");
  const driver = trip ? getDriver(trip.driverId) : undefined;
  const first = (driver?.name ?? "your driver").split(" ")[0];

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Rate your ride" back={`/app/booking/${b.id}`} />
      <form className="grid place-items-center gap-6 text-center" onSubmit={(e) => { e.preventDefault(); rate(b.id, stars); router.push("/app/trips"); }}>
        <Avatar name={driver?.name ?? "MYWAY"} size={88} />
        <h2 className="text-display-md">How was your ride with {first}?</h2>
        <div role="radiogroup" aria-label="Star rating" className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setStars(n)} className="pressable rounded-full p-1">
              <Icon name="star" size={44} strokeWidth={2} className={cn("transition-colors duration-150", n <= stars ? "fill-primary text-outline" : "text-fg-disabled")} />
            </button>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="What went well">
          {TAGS.map((t) => <Chip key={t} active={tags.includes(t)} onClick={() => setTags((v) => v.includes(t) ? v.filter((x) => x !== t) : [...v, t])}>{t}</Chip>)}
        </div>
        <div className="w-full space-y-2"><p className="text-sm font-bold text-fg-muted">Add a tip for {first}?</p>
          <div className="flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Tip">{TIPS.map((t) => <Chip key={t} active={tip === t} role="radio" aria-checked={tip === t} onClick={() => setTip(t)}>{t}</Chip>)}</div>
        </div>
        <label className="block w-full text-left"><span className="sr-only">Tell us more</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Tell us more (optional)" className="w-full resize-none rounded-lg border-2 border-line bg-surface-sunken p-4 outline-none transition-colors focus:border-line-strong focus:bg-surface" />
        </label>
        <Button type="submit" size="lg" full>Submit rating</Button>
      </form>
    </div>
  );
}
