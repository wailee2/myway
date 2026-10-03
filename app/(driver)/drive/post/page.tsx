import type { Metadata } from "next";
import { PostTrip } from "@/features/driver/post-trip";

export const metadata: Metadata = { title: "Post a trip" };

export default function Page() {
  return <PostTrip />;
}
