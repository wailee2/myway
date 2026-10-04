"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/primitives";
import { LogoutRow, MenuList, PreferencesCard, ProfileHeader, StatTrio } from "@/features/shared/account-ui";
import { useOperator } from "@/lib/store/operator";

export function OperatorProfile() {
  const { buses, trips } = useOperator();
  const maint = buses.filter((b) => b.status === "maintenance").length;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Company profile" />
      <ProfileHeader fallbackName="Operator" badges={<><Badge tone="success" icon="badge">Verified operator</Badge><Badge tone="warning" icon="star">4.7</Badge></>} />
      <StatTrio items={[[String(buses.length), "Buses"], [String(trips.length), "Trips today"], ["3", "Lines"]]} />
      <MenuList
        items={[
          { icon: "bus", title: "Fleet", sub: `${buses.length} buses${maint ? ` · ${maint} in maintenance` : ""}`, href: "/operator/fleet" },
          { icon: "trend", title: "Reports", sub: "Revenue and top routes", href: "/operator/reports" },
          { icon: "help", title: "Help and support", sub: "Trips, tickets, settlements", href: "/operator/help" },
        ]}
      />
      <PreferencesCard />
      <MenuList items={[]}><LogoutRow /></MenuList>
    </div>
  );
}
