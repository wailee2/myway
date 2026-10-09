"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/support";
import { ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/primitives";
import { FAQ } from "@/lib/data/misc";

export function Help({ faq = FAQ, back = "/app/profile" }: { faq?: { q: string; a: string }[]; back?: string }) {
  const [q, setQ] = useState("");
  const list = faq.filter((f) => (f.q + f.a).toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Help and support" back={back} />
      <Field label="Search help" icon="search" placeholder="e.g. refund" value={q} onChange={(e) => setQ(e.target.value)} />
      {(SUPPORT_EMAIL || SUPPORT_PHONE) ? <div className="grid gap-3 sm:grid-cols-2">{SUPPORT_EMAIL && <ButtonLink href={`mailto:${SUPPORT_EMAIL}`} icon="chat">Email us</ButtonLink>}{SUPPORT_PHONE && <ButtonLink href={`tel:${SUPPORT_PHONE}`} variant="outline" icon="phone">Call</ButtonLink>}</div> : <p className="rounded-lg bg-surface-sunken p-3 text-sm text-fg-secondary">Support contact details are set in the app configuration (see .env.example).</p>}
      <h2 className="font-sans text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Popular questions</h2>
      {list.length ? (
        <div className="divide-y divide-line rounded-xl border border-line bg-surface">
          {list.map((f) => (
            <details key={f.q} className="group px-4">
              <summary className="flex cursor-pointer items-center justify-between gap-3 py-4 font-bold">{f.q}<Icon name="chevD" size={18} className="shrink-0 transition-transform duration-200 ease-out-strong group-open:rotate-180" /></summary>
              <p className="pb-4 text-fg-muted">{f.a}</p>
            </details>
          ))}
        </div>
      ) : <EmptyState title="No answers for that" body="Try a different word, or chat with us above." />}
    </div>
  );
}
