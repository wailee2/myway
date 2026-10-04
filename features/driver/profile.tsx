"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/primitives";
import { LogoutRow, MenuList, PreferencesCard, ProfileHeader, StatTrio } from "@/features/shared/account-ui";
import { useDriver } from "@/lib/store/driver";

export function DriverProfile() {
  const payout = useDriver((s) => s.payout);
  const trips = useDriver((s) => s.history.length + 308);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Profile" />
      <ProfileHeader fallbackName="Driver" badges={<><Badge tone="success" icon="badge">Verified driver</Badge><Badge tone="warning" icon="star">4.9</Badge></>} />
      <StatTrio items={[[String(trips), "Trips"], ["4.9", "Rating"], ["97%", "Accepted"]]} />
      <MenuList
        items={[
          { icon: "car", title: "Vehicle and documents", sub: "Toyota Corolla · 1 document expiring", href: "/drive/vehicle" },
          { icon: "history", title: "Trip history", sub: "Past trips and what you earned", href: "/drive/history" },
          { icon: "star", title: "Ratings and reviews", sub: "What riders say about you", href: "/drive/reviews" },
          { icon: "bank", title: "Payout account", sub: `${payout.bank} •• ${payout.accountNumber.slice(-4)}`, href: "/drive/payout" },
          { icon: "help", title: "Help and support", sub: "Payments, riders, documents", href: "/drive/help" },
        ]}
      />
      <PreferencesCard fallbackTheme="dark" />
      <MenuList items={[]}><LogoutRow /></MenuList>
    </div>
  );
}
