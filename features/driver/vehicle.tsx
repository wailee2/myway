"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge, Banner, Card } from "@/components/ui/primitives";
import { CarArt } from "@/components/illustrations/vehicles";

type DocStatus = "verified" | "review" | "expiring";
const initial: { name: string; status: DocStatus }[] = [
  { name: "Driver’s licence", status: "verified" },
  { name: "Vehicle papers", status: "verified" },
  { name: "Insurance", status: "review" },
  { name: "Roadworthiness", status: "expiring" },
];
const tone = { verified: "success", review: "warning", expiring: "danger" } as const;
const label = { verified: "Verified", review: "In review", expiring: "Expires in 12 days" } as const;

export function Vehicle() {
  const [docs, setDocs] = useState(initial);
  const [msg, setMsg] = useState("");
  const upload = () => {
    setDocs((d) => d.map((x) => (x.status === "expiring" ? { ...x, status: "review" as const } : x)));
    setMsg("Roadworthiness renewal uploaded. We’ll review it within 24 hours.");
  };
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Vehicle and documents" back="/drive/profile" />
      <Card tone="primary" className="flex items-center gap-4 p-5"><CarArt className="w-28 shrink-0" /><div><p className="font-display text-xl font-extrabold">Toyota Corolla 2015</p><p className="text-sm font-semibold text-primary-fg/80">White · ABJ-482-KJ · 4 passenger seats</p></div></Card>
      <ul className="grid gap-2.5">
        {docs.map((d) => <li key={d.name}><Card className="flex items-center gap-3.5 p-3.5"><span className="grid size-11 place-items-center rounded-[0.875rem] bg-surface-sunken text-primary"><Icon name="doc" size={22} /></span><span className="flex-1 font-bold">{d.name}</span><Badge tone={tone[d.status]}>{label[d.status]}</Badge></Card></li>)}
      </ul>
      {msg && <Banner tone="success" icon="check">{msg}</Banner>}
      <Button size="lg" full icon="upload" onClick={upload}>Upload document</Button>
    </div>
  );
}
