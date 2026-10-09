import type { Metadata } from "next";
import { Profile } from "@/features/rider/profile";

export const metadata: Metadata = { title: "Profile" };

export default function Page() {
  return <Profile />;
}
