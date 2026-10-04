"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/illustrations/brand";
import { Icon, type IconName } from "@/components/ui/icon";
import { useHydrated } from "@/lib/store/hydrate";
import { useSession } from "@/lib/store/session";
import { useBooking } from "@/lib/store/booking";
import { useAlerts } from "@/lib/store/alerts";
import { cn } from "@/lib/cn";
import { PageTransition } from "./page-transition";
import { ThemeToggle } from "./theme-toggle";

type Variant = "rider" | "driver" | "operator";
/** `also` = other routes that belong to this tab (so e.g. Vehicle keeps the Profile tab lit). */
interface NavItem { href: string; label: string; icon: IconName; also?: string[] }

const NAV: Record<Variant, NavItem[]> = {
  rider: [
    { href: "/app", label: "Home", icon: "home", also: ["/app/search", "/app/trip", "/app/checkout", "/app/booking", "/app/rate", "/app/bus", "/app/request-route"] },
    { href: "/app/trips", label: "My trips", icon: "ticket" },
    { href: "/app/wallet", label: "Wallet", icon: "wallet", also: ["/app/passes"] },
    { href: "/app/profile", label: "Profile", icon: "user", also: ["/app/help", "/app/safety"] },
  ],
  driver: [
    { href: "/drive", label: "Drive", icon: "car", also: ["/drive/live"] },
    { href: "/drive/post", label: "Post a trip", icon: "plus" },
    { href: "/drive/earnings", label: "Earnings", icon: "wallet", also: ["/drive/withdraw"] },
    { href: "/drive/profile", label: "Profile", icon: "user", also: ["/drive/vehicle", "/drive/history", "/drive/reviews", "/drive/payout", "/drive/help"] },
  ],
  operator: [
    { href: "/operator", label: "Dashboard", icon: "trend", also: ["/operator/trips"] },
    { href: "/operator/manifest", label: "Manifest", icon: "users" },
    { href: "/operator/scan", label: "Scan", icon: "scan" },
    { href: "/operator/profile", label: "Profile", icon: "user", also: ["/operator/fleet", "/operator/reports", "/operator/help"] },
  ],
};

const HOME: Record<Variant, string> = { rider: "/app", driver: "/drive", operator: "/operator" };
const NOTIFICATIONS: Record<Variant, string> = { rider: "/app/notifications", driver: "/drive/notifications", operator: "/operator/notifications" };

function isActive(path: string, item: NavItem, root: string) {
  // The home tab ("/drive") must not light up for every sub-page, only for itself and its own `also` routes.
  const own = item.href === root ? path === root : path === item.href || path.startsWith(`${item.href}/`);
  return own || (item.also ?? []).some((h) => path === h || path.startsWith(`${h}/`));
}

export function AppShell({ variant, children }: { variant: Variant; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const ready = useHydrated();
  const onboarded = useSession((s) => s.onboarded);
  const role = useSession((s) => s.role);
  const riderUnread = useBooking((s) => s.notifications.filter((n) => n.unread).length);
  const driverUnread = useAlerts((s) => s.driver.filter((n) => n.unread).length);
  const operatorUnread = useAlerts((s) => s.operator.filter((n) => n.unread).length);
  const unread = { rider: riderUnread, driver: driverUnread, operator: operatorUnread }[variant];
  const items = NAV[variant];

  // Signed out -> welcome. Signed in as another role -> that role's own app.
  const wrongApp = Boolean(role) && role !== variant;
  useEffect(() => {
    if (!ready) return;
    if (!onboarded) router.replace("/");
    else if (role && role !== variant) router.replace(HOME[role]);
  }, [ready, onboarded, role, variant, router]);

  const show = ready && onboarded && !wrongApp;
  const dark = variant === "driver";

  return (
    <div className={cn("min-h-dvh bg-background text-fg", dark && "[color-scheme:dark]")}>
      <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line px-[var(--page-gutter)]">
        <Link href={HOME[variant]} aria-label="MYWAY home"><Logo size={30} className="[&_span]:text-[1.35rem]" /></Link>
        <div className="flex items-center gap-2">
          <Link href={NOTIFICATIONS[variant]} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="pressable relative grid size-10 place-items-center rounded-full border border-line bg-surface transition-colors hover:bg-surface-sunken">
            <Icon name="bell" size={20} />
            {unread > 0 && <span className="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-danger" />}
          </Link>
          <ThemeToggle fallback={dark ? "dark" : undefined} className="size-10! justify-center px-0!" />
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl px-[var(--page-gutter)] pb-[calc(var(--tabbar-h)+1.5rem)] pt-5">
        {show ? <PageTransition>{children}</PageTransition> : <ShellSkeleton />}
      </main>

      <nav aria-label="Main" className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line pb-(--safe-bottom)">
        <ul className="mx-auto flex max-w-lg items-start justify-between px-2 pt-2">
          {items.map((i) => {
            const on = isActive(path, i, HOME[variant]);
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
