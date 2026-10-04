import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";

/**
 * `latin-ext` matters: the naira sign (₦, U+20A6) lives in that subset.
 * Without it, prices fall back to a system font and look off-brand.
 * Fonts are self-hosted by Next at build time (no runtime request to Google).
 */
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
  display: "swap",
});

export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
});
