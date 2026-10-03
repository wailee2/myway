import type { Metadata } from "next";
import { BookingView } from "@/features/rider/booking-view";

export const metadata: Metadata = { title: "Your booking" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingView id={id} />;
}
