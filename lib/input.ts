/** Input helpers: users type plain digits, we enforce the limits so they never have to count or add spaces. */

export const digitsOnly = (raw: string, max: number) => raw.replace(/\D/g, "").slice(0, max);

/**
 * Nigerian mobile number as typed. Accepts 8031234567, 08031234567, +234 803 123 4567 or a paste with
 * spaces/dashes. Capped at 11 digits when it starts with 0, otherwise 10.
 */
export function phoneInput(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("234") && d.length > 10) d = d.slice(3); // pasted with country code
  return d.slice(0, d.startsWith("0") ? 11 : 10);
}

/** 10-digit national number (no leading 0), or null if it isn't a valid Nigerian mobile. */
export function nationalPhone(value: string) {
  const d = value.replace(/\D/g, "").replace(/^0/, "");
  return /^[789]\d{9}$/.test(d) ? d : null;
}

/** "8011111111" -> "+234 801 111 1111" */
export function formatPhone(national: string) {
  const d = national.replace(/\D/g, "").replace(/^0/, "");
  return d.length === 10 ? `+234 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : d ? `+234 ${d}` : "";
}
