"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/illustrations/brand";
import { ButtonLink, IconButton } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#products", label: "Car and bus" },
  { href: "#safety", label: "Safety" },
  { href: "#drivers", label: "Drive with us" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="glass sticky top-0 z-40 border-b border-line">
      <div className="mx-auto flex h-[var(--header-h)] max-w-7xl items-center gap-4 px-[var(--page-gutter)]">
        <Link href="/" aria-label="MYWAY home" className="rounded-md">
          <Logo />
        </Link>
        <nav aria-label="Primary" className="ml-8 hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="rounded-full px-4 py-2 text-sm font-bold text-fg-secondary transition-colors hover:bg-surface-sunken hover:text-fg">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <ThemeToggle />
            <ButtonLink href="/app" size="sm" iconRight="arrowR">Open the app</ButtonLink>
          </div>
          <IconButton icon={open ? "x" : "menu"} label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-nav" className="lg:hidden" onClick={() => setOpen((v) => !v)} />
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="animate-fade border-t border-line bg-surface px-[var(--page-gutter)] pb-6 pt-3 lg:hidden">
          <ul className="grid">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)} className="block border-b border-line py-3.5 text-lg font-bold">{l.label}</a>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-3">
            <ButtonLink href="/app" full iconRight="arrowR">Open the app</ButtonLink>
            <ThemeToggle />
          </div>
        </nav>
      )}
    </header>
  );
}
