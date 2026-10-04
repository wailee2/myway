"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/illustrations/brand";
import { Avatar } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icon";
import { useHydrated } from "@/lib/store/hydrate";
import { useSession } from "@/lib/store/session";
import { useBooking } from "@/lib/store/booking";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "./theme-toggle";

type Variant = "rider" | "driver" | "operator";
interface NavItem { href: string; label: string; icon: IconName; tab?: boolean }

const NAV: Record<Variant, NavItem[]> = {
  rider: [
    { href: "/app", label: "Home", icon: "home", tab: true },
    { href: "/app/bus", label: "Bus lines", icon: "bus" },
    { href: "/app/trips", label: "My trips", icon: "ticket", tab: true },
    { href: "/app/wallet", label: "Wallet", icon: "wallet", tab: true },
    { href: "/app/notifications", label: "Notifications", icon: "bell" },
    { href: "/app/safety", label: "Safety", icon: "shield" },
    { href: "/app/profile", label: "Profile", icon: "user", tab: true },
    { href: "/app/help", label: "Help", icon: "help" },
  ],
  driver: [
    { href: "/drive", label: "Drive", icon: "car", tab: true },
    { href: "/drive/post", label: "Post a trip", icon: "plus", tab: true },
    { href: "/drive/earnings", label: "Earnings", icon: "wallet", tab: true },
    { href: "/drive/vehicle", label: "Vehicle", icon: "doc", tab: true },
  ],
  operator: [
    { href: "/operator", label: "Dashboard", icon: "trend", tab: true },
    { href: "/operator/manifest", label: "Manifest", icon: "users", tab: true },
    { href: "/operator/scan", label: "Scan tickets", icon: "scan", tab: true },
  ],
};

const HOME: Record<Variant, string> = { rider: "/app", driver: "/drive", operator: "/operator" };
const SWITCH: Record<Variant, { href: string; label: string }[]> = {
  rider: [{ href: "/drive", label: "Switch to driver app" }, { href: "/operator", label: "Operator console" }],
  driver: [{ href: "/app", label: "Switch to rider app" }],
  operator: [{ href: "/app", label: "Switch to rider app" }],
};

function isActive(path: string, href: string, variant: Variant) {
  if (href === HOME[variant]) return path === href || path.startsWith(`${href}/search`) || path.startsWith(`${href}/trip/`) || path.startsWith(`${href}/checkout`) || path.startsWith(`${href}/booking/`) || path.startsWith(`${href}/rate/`);
  return path === href || path.startsWith(`${href}/`);
}

export function AppShell({ variant, children }: { variant: Variant; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const ready = useHydrated();
  const onboarded = useSession((s) => s.onboarded);
  const name = useSession((s) => s.name);
  const unread = useBooking((s) => s.notifications.filter((n) => n.unread).length);
  const items = NAV[variant];

  useEffect(() => {
    if (ready && !onboarded) router.replace("/get-started");
  }, [ready, onboarded, router]);

  const dark = variant === "driver";

  return (
    <div className={cn("min-h-dvh bg-background text-fg", dark && "[color-scheme:dark]")}>
      <div className="lg:grid lg:grid-cols-[var(--sidebar-w)_1fr]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-line bg-surface p-5 lg:flex" aria-label="App navigation">
          <Link href="/" aria-label="MYWAY home" className="px-2 pt-1"><Logo /></Link>
          <nav className="flex flex-1 flex-col gap-1">
            {items.map((i) => {
              const on = isActive(path, i.href, variant);
              return (
                <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined} className={cn("pressable flex items-center gap-3 rounded-lg px-3.5 py-3 font-bold transition-colors", on ? "bg-primary text-primary-fg" : "text-fg-secondary hover:bg-surface-sunken hover:text-fg")}>
                  <Icon name={i.icon} size={20} />
                  {i.label}
                  {i.href === "/app/notifications" && unread > 0 && <span className="ml-auto grid size-6 place-items-center rounded-full bg-danger text-xs font-extrabold text-white">{unread}</span>}
                </Link>
              );
            })}
          </nav>
          <div className="space-y-3 border-t border-line pt-4">
            {SWITCH[variant].map((s) => (
              <Link key={s.href} href={s.href} className="block rounded-lg px-3.5 py-2 text-sm font-bold text-fg-muted hover:bg-surface-sunken hover:text-fg">{s.label}</Link>
            ))}
            <div className="flex items-center gap-3 rounded-lg bg-surface-sunken p-3">
              <Avatar name={name} tone="ink" size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{ready ? name : "…"}</p>
                <p className="text-caption capitalize text-fg-muted">{variant}</p>
              </div>
              <ThemeToggle className="size-11 justify-center px-0" />
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          {/* Mobile top bar */}
          <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line px-[var(--page-gutter)] lg:hidden">
            <Link href={HOME[variant]} aria-label="MYWAY home"><Logo size={30} className="[&_span]:text-[1.35rem]" /></Link>
            <div className="flex items-center gap-2">
              {variant === "rider" && (
                <Link href="/app/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="pressable relative grid size-10 place-items-center rounded-full border border-line bg-surface">
                  <Icon name="bell" size={20} />
                  {unread > 0 && <span className="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-danger" />}
                </Link>
              )}
              <ThemeToggle className="size-10 justify-center px-0" />
            </div>
          </header>

          <main id="main" className="mx-auto w-full max-w-6xl px-[var(--page-gutter)] pb-[calc(var(--tabbar-h)+1.5rem)] pt-5 lg:pb-12 lg:pt-8">
            {ready && onboarded ? children : <ShellSkeleton />}
          </main>
        </div>
      </div>

      {/* Mobile tab bar */}
      <nav aria-label="Main" className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="mx-auto flex max-w-lg items-start justify-between px-2 pt-2">
          {items.filter((i) => i.tab).map((i) => {
            const on = isActive(path, i.href, variant);
            return (
              <li key={i.href} className="flex-1">
                <Link href={i.href} aria-current={on ? "page" : undefined} className="pressable flex flex-col items-center gap-1 pb-2 text-[0.6875rem] font-bold">
                  <span className={cn("grid h-8 w-14 place-items-center rounded-full transition-colors duration-200", on ? "bg-primary text-primary-fg" : "text-fg-muted")}>
                    <Icon name={i.icon} size={24} />
                  </span>
                  <span className={on ? "text-fg" : "text-fg-muted"}>{i.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading your app">
      <div className="h-10 w-2/3 animate-pulse rounded-lg bg-surface-sunken" />
      <div className="h-64 animate-pulse rounded-xl bg-surface-sunken" />
      <div className="h-24 animate-pulse rounded-xl bg-surface-sunken" />
    </div>
  );
}
