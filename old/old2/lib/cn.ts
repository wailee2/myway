import { clsx, type ClassValue } from "clsx";

/** Tiny class-name helper. Tailwind v4 resolves conflicts by source order, so no tailwind-merge needed for this MVP. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
