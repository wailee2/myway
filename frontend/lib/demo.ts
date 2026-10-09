import { LIVE } from "./api/live";
import type { Role } from "./types";

/**
 * ONE switch for everything that only exists to make the prototype demonstrable:
 * demo accounts, "move the trip along" controls, sample demand numbers, demo OTP notes, seeded history.
 *
 * Set NEXT_PUBLIC_DEMO=false (e.g. in .env.production) to run without any of it.
 * Anything gated on `DEMO` must be removed or replaced by real data before launch.
 */
export const DEMO = process.env.NEXT_PUBLIC_DEMO !== "false";

export const DEMO_OTP_NOTE = LIVE ? "Demo: the code is 123456." : "Demo: any 6 digits will work.";

export interface DemoAccount { name: string; phone: string; role: Role }
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { name: "Wailee Kareem", phone: "8011111111", role: "rider" },
  { name: "Ade Okafor", phone: "8022222222", role: "driver" },
  { name: "Cityline Coaches", phone: "8033333333", role: "operator" },
];

/** Riders who "book in" on the driver's live-trip screen while the demo runs. */
export const DEMO_DRIVER_RIDERS = [
  { name: "Chidi Eze", seat: "Behind driver", code: "4821" },
  { name: "Funke Adeyemi", seat: "Middle", code: "7305" },
  { name: "Musa Ibrahim", seat: "Front seat", code: "1196" },
];

/** First names + initial used for co-rider avatars on mock trips. Real data comes from the backend. */
export const DEMO_CO_RIDERS = ["Amina K.", "Tunde O.", "Ngozi A.", "Ibrahim S.", "Funke A.", "Emeka C.", "Zainab M.", "Kelechi N."];

/** Sample "people looking for this route" counts, keyed by route id. Labelled as sample data in the UI. */
export const DEMO_ROUTE_DEMAND: Record<string, number> = { "r-nyanya-cbd": 14, "r-nyanya-jabi": 6, "r-kubwa-wuse": 9 };

/** Placeholder pump price used ONLY for the driver fare guide while no live fuel feed exists. */
export const DEMO_FUEL_PRICE_PER_LITRE = 1400;

export const DEMO_TRUSTED_CONTACTS = [
  { id: "tc1", name: "Mum", phone: "8055550101" },
  { id: "tc2", name: "Tunde", phone: "8055550102" },
];

/** Sample passenger list for the operator manifest and ticket scanner (seat, name, already boarded). */
export const DEMO_MANIFEST: readonly (readonly [string, string, boolean])[] = [
  ["1B", "Wailee K.", true], ["2A", "Ibrahim S.", true], ["2C", "Ngozi O.", true], ["4B", "Tunde A.", false], ["5D", "Amina Y.", false], ["6A", "Emeka C.", false],
];
