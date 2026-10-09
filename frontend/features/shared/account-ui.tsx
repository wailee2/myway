"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, Field, Segmented, Switch, useDialog } from "@/components/ui/form";
import { Icon, type IconName } from "@/components/ui/icon";
import { Avatar, Eyebrow, Row } from "@/components/ui/primitives";
import { useResolvedTheme } from "@/lib/hooks/use-theme";
import { formatPhone } from "@/lib/input";
import { useSession } from "@/lib/store/session";

/** Pieces shared by the rider, driver and operator profile screens. */

export function ProfileHeader({ fallbackName, badges }: { fallbackName: string; badges: ReactNode }) {
  const { name, phone, updateName } = useSession();
  const dlg = useDialog();
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState("");
  const shown = name || fallbackName;
  const save = () => {
    if (draft.trim().length < 2) return setErr("Enter at least 2 characters.");
    updateName(draft.trim());
    dlg.close();
  };
  return (
    <>
      <section className="flex items-center gap-4" aria-label="Account">
        <Avatar name={shown} size={72} tone="ink" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <h2 className="font-display text-2xl font-extrabold leading-tight">{shown}</h2>
          <p className="text-sm text-fg-muted">{formatPhone(phone) || "No number yet"}</p>
          <div className="flex flex-wrap gap-2">{badges}</div>
        </div>
        <button type="button" onClick={() => { setDraft(name); setErr(""); dlg.open(); }} aria-label="Edit name" className="pressable grid size-10 shrink-0 place-items-center self-start rounded-full border-2 border-line bg-surface text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg"><Icon name="edit" size={18} /></button>
      </section>
      <Dialog dialogRef={dlg.ref} title="Edit your name">
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <Field label="Name" autoComplete="name" maxLength={40} value={draft} onChange={(e) => { setDraft(e.target.value); setErr(""); }} error={err || undefined} />
          <Button type="submit" size="lg" full>Save</Button>
          <Button variant="ghost" size="lg" full onClick={dlg.close}>Cancel</Button>
        </form>
      </Dialog>
    </>
  );
}

export function StatTrio({ items }: { items: [string, string][] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(([v, l]) => (
        <div key={l} className="rounded-xl border border-line bg-surface p-3.5"><p className="font-display text-xl font-extrabold leading-tight">{v}</p><p className="text-sm text-fg-muted">{l}</p></div>
      ))}
    </div>
  );
}

export interface MenuItem { icon: IconName; title: string; sub?: string; href: string; right?: ReactNode }

/** Tappable list. Every row highlights on hover and press. */
export function MenuList({ items, children }: { items: MenuItem[]; children?: ReactNode }) {
  return (
    <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
      {items.map((m) => (
        <li key={m.title} className="first:rounded-t-xl last:rounded-b-xl">
          <Link href={m.href} className="block rounded-[inherit] px-4 transition-colors duration-150 hover:bg-surface-sunken active:bg-surface-sunken">
            <Row icon={m.icon} title={m.title} sub={m.sub} right={m.right ?? <Icon name="chevR" size={18} className="shrink-0 text-fg-disabled" />} />
          </Link>
        </li>
      ))}
      {children}
    </ul>
  );
}

/** Log out with a confirmation sheet, hover and press states. Works for every role. */
export function LogoutRow() {
  const router = useRouter();
  const signOut = useSession((s) => s.signOut);
  const dlg = useDialog();
  const out = () => {
    dlg.close();
    router.replace("/");
    signOut();
  };
  return (
    <li className="rounded-b-xl">
      <button type="button" onClick={dlg.open} className="block w-full cursor-pointer rounded-full px-4 text-left transition-colors duration-150 hover:bg-danger-soft active:bg-danger-soft focus-visible:bg-danger-soft">
        <Row icon="logout" tone="danger" title={<span className="text-danger-text  ">Log out</span>}  />
      </button>
      <Dialog dialogRef={dlg.ref} title="Log out of MYWAY?">
        <p className="mb-5 text-fg-muted">You can log back in any time with your number and a code.</p>
        <div className="grid gap-3">
          <Button variant="danger" size="lg" full icon="logout" onClick={out}>Log out</Button>
          <Button variant="ghost" size="lg" full onClick={dlg.close}>Stay signed in</Button>
        </div>
      </Dialog>
    </li>
  );
}

type Lang = "English" | "Pidgin" | "Hausa";

export function PreferencesCard({ fallbackTheme }: { fallbackTheme?: "light" | "dark" }) {
  const { language, setProfile } = useSession();
  const { mode, set } = useResolvedTheme(fallbackTheme);
  return (
    <section aria-labelledby="pref-title" className="space-y-4 rounded-xl border border-line bg-surface p-4">
      <Eyebrow><span id="pref-title">Preferences</span></Eyebrow>
      <div className="space-y-2.5">
        <span className="flex items-center gap-2 font-bold"><Icon name="globe" size={20} />Language</span>
        <Segmented<Lang> label="Language" value={language as Lang} onChange={(v) => setProfile({ language: v })} options={[{ value: "English", label: "English" }, { value: "Pidgin", label: "Pidgin" }, { value: "Hausa", label: "Hausa" }]} />
      </div>
      <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 font-bold"><Icon name="moon" size={20} />Dark mode</span><Switch checked={mode === "dark"} onChange={(v) => set(v ? "dark" : "light")} label="Dark mode" /></div>
    </section>
  );
}
