import { Help } from "@/features/rider/help";
import { OPERATOR_FAQ } from "@/lib/data/misc";

export const metadata = { title: "Help and support" };
export default function Page() { return <Help faq={OPERATOR_FAQ} back="/operator/profile" />; }
