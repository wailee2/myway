import { Icon } from "@/components/ui/icon";
import { Eyebrow } from "@/components/ui/primitives";
import { FAQ } from "@/lib/data/misc";

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-4xl scroll-mt-20 px-[var(--page-gutter)] py-20 lg:py-28">
      <Eyebrow className="mb-3">Questions</Eyebrow>
      <h2 id="faq-title" className="mb-8 text-display-lg">Before you ride</h2>
      <div className="divide-y divide-line rounded-xl border border-line bg-surface">
        {FAQ.map((f) => (
          <details key={f.q} className="group px-5 py-1 sm:px-7">
            <summary className="flex cursor-pointer items-center justify-between gap-4 py-5 text-lg font-bold">
              {f.q}
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-sunken transition-transform duration-200 ease-out-strong group-open:rotate-45">
                <Icon name="plus" size={18} strokeWidth={2.6} />
              </span>
            </summary>
            <p className="pb-5 pr-12 text-fg-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
