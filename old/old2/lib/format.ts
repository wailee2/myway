const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** 1200 -> "₦1,200". Needs the `latin-ext` font subset for the ₦ glyph (see app/fonts.ts). */
export const formatNaira = (n: number) => naira.format(n).replace("NGN", "₦").replace(/\s/g, "");

export const signedNaira = (n: number) => `${n >= 0 ? "+" : "-"}${formatNaira(Math.abs(n))}`;

export function formatCountdown(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function makeCode(len = 4) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join("");
}

export function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}
