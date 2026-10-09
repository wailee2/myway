import type { Metadata } from "next";
import { Notifications } from "@/features/rider/notifications";

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return <Notifications />;
}
