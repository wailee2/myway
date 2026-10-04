"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Segmented } from "@/components/ui/form";
import { Icon, type IconName } from "@/components/ui/icon";
import { Avatar, Badge, Row } from "@/components/ui/primitives";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useSession } from "@/lib/store/session";

type Lang = "English" | "Pidgin" | "Hausa";

export function Profile() {
  const router = useRouter();
  const { name, phone, language, setProfile, signOut } = useSession();
  const menu: [IconName, string, string, string][] = [
    ["card", "Payment methods", "Wallet, card, cash", "/app/wallet"],
    ["pin", "Saved places", "Home and work", "/app"],
    ["users", "Trusted contacts", "Mum, Tunde", "/app/safety"],
    ["help", "Help and support", "Chat or call us", "/app/help"],
  ];
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Profile" />
      <section className="flex items-center gap-4" aria-label="Account">
        <Avatar name={name || "W"} size={72} tone="ink" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <h2 className="truncate font-display text-3xl font-extrabold">{name}</h2>
          <p className="text-sm text-fg-muted">{phone || "+234 803 123 4567"}</p>
          <div className="flex gap-2"><Badge tone="success" icon="badge">ID verified</Badge><Badge tone="warning" icon="star">4.9</Badge></div>
        </div>
      </section>
      <Link href="/drive" className="pressable sticker flex items-center gap-3 rounded-xl bg-primary p-4 text-primary-fg"><Icon name="car" size={24} /><span className="min-w-0 flex-1"><span className="block font-display text-lg font-extrabold">Drive with MYWAY</span><span className="block text-sm font-semibold text-primary-fg/80">Turn your daily commute into income</span></span><Icon name="arrowR" size={18} /></Link>

      <section aria-labelledby="pref-title" className="space-y-3 rounded-xl border border-line bg-surface p-4">
        <h2 id="pref-title" className="font-sans text-caption font-extrabold uppercase tracking-[0.14em] text-fg-muted">Preferences</h2>
        <div className="flex flex-wrap items-center justify-between gap-3"><span className="flex items-center gap-2 font-bold"><Icon name="globe" size={20} />Language</span>
          <Segmented<Lang> label="Language" value={language as Lang} onChange={(v) => setProfile({ language: v })} options={[{ value: "English", label: "English" }, { value: "Pidgin", label: "Pidgin" }, { value: "Hausa", label: "Hausa" }]} />
        </div>
        <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 font-bold"><Icon name="sliders" size={20} />Appearance</span><ThemeToggle withLabel /></div>
      </section>

      <ul className="divide-y divide-line rounded-xl border border-line bg-surface px-4">
        {menu.map(([ic, t, s, href]) => <li key={t}><Link href={href} className="block"><Row icon={ic} title={t} sub={s} right={<Icon name="chevR" size={18} className="text-fg-disabled" />} /></Link></li>)}
        <li><button type="button" onClick={() => { signOut(); router.push("/"); }} className="block w-full text-left"><Row icon="logout" tone="danger" title="Log out" /></button></li>
      </ul>
    </div>
  );
}
