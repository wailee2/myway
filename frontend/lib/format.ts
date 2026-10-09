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

/* ------------------------------ Time and dates ------------------------------ */

/** "Good morning" / "Good afternoon" / "Good evening" from the device clock. */
export function greeting(now = new Date()) {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/** "07:10" or "7:10" -> minutes since midnight. */
export function toMinutes(t: string) {
  const [h = "0", m = "0"] = t.split(":");
  return Number(h) * 60 + Number(m);
}

/** Adds (or subtracts) minutes to a 24h time, wrapping at midnight. */
export function addMinutes(t: string, mins: number) {
  const total = (((toMinutes(t) + mins) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** "07:10" -> "7:10 AM", "17:30" -> "5:30 PM". */
export function formatTime(t: string) {
  const m = toMinutes(t);
  const h24 = Math.floor(m / 60) % 24;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m % 60).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
}

const SHORT_DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHORT_MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface DayOption { offset: number; label: string; long: string }

/** Today, Tomorrow, then real weekday + date: "Fri 9". */
export function dayOptions(count = 4, now = new Date()): DayOption[] {
  return Array.from({ length: count }, (_, offset) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const short = `${SHORT_DAY[d.getDay()]} ${d.getDate()}`;
    const label = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : short;
    return { offset, label, long: `${label}${offset < 2 ? ` · ${short} ${SHORT_MONTH[d.getMonth()]}` : ` ${SHORT_MONTH[d.getMonth()]}`}` };
  });
}

export const dayLabel = (offset: number) => dayOptions(Math.max(offset + 1, 1))[offset]?.label ?? "Today";

/** 0 = Monday … 6 = Sunday */
export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const WEEKDAY_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

/** "Weekdays", "Every day", "Mon, Wed" */
export function describeDays(days: number[]) {
  const sorted = [...days].sort();
  if (sorted.join() === "0,1,2,3,4") return "Weekdays";
  if (sorted.length === 7) return "Every day";
  if (sorted.join() === "5,6") return "Weekends";
  return sorted.map((d) => WEEKDAYS[d]!.slice(0, 3)).join(", ");
}

export const timeAgoLabel = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/** "4.9 ★" or "New" for a driver nobody has rated yet. */
export const ratingLabel = (rating: number | null | undefined) => (rating ? `${rating} ★` : "New");
