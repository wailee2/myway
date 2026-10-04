import type { Metadata } from "next";
import { RequestRoute } from "@/features/rider/request-route";

export const metadata: Metadata = { title: "Request a route" };

export default function Page() {
  return <RequestRoute />;
}
