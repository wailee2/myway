import type { Metadata } from "next";
import { UsualRoutes } from "@/features/rider/usual-routes";

export const metadata: Metadata = { title: "Usual routes" };

export default function Page() {
  return <UsualRoutes />;
}
