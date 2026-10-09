"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/primitives";
import { LogoutRow, MenuList, PreferencesCard, ProfileHeader } from "@/features/shared/account-ui";

export function Profile() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Profile" />
      <ProfileHeader fallbackName="Rider" badges={<><Badge tone="success" icon="badge">ID verified</Badge><Badge tone="warning" icon="star">4.9</Badge></>} />
      <PreferencesCard />
      <MenuList
        items={[
          { icon: "card", title: "Payment methods", sub: "Wallet, card, cash", href: "/app/wallet" },
          { icon: "route", title: "Usual routes", sub: "Rides you take regularly", href: "/app/usual" },
          { icon: "ticket", title: "Passes", sub: "Weekly and monthly bus passes", href: "/app/passes" },
          { icon: "users", title: "Safety and trusted contacts", sub: "SOS, contacts and reports", href: "/app/safety" },
          { icon: "help", title: "Help and support", sub: "Chat or call us", href: "/app/help" },
        ]}
      >
        <LogoutRow />
      </MenuList>
    </div>
  );
}
