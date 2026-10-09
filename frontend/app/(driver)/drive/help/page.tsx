import { Help } from "@/features/rider/help";
import { DRIVER_FAQ } from "@/lib/data/misc";

export const metadata = { title: "Help and support" };
export default function Page() { return <Help faq={DRIVER_FAQ} back="/drive/profile" />; }
