// Small pure helpers for the public site and the content manager.

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** "0813 913 9020 / 0911 696 1727" -> two numbers. */
export function splitPhones(value: string | null | undefined): string[] {
  return (value ?? "").split(/[\/,;|]| or /i).map((p) => p.trim()).filter((p) => /\d{7,}/.test(p.replace(/\D/g, "")));
}

/** A number for tel: links, e.g. "0813 913 9020" -> "+2348139139020". */
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return `tel:+${digits}`;
  if (digits.startsWith("0")) return `tel:+234${digits.slice(1)}`;
  return `tel:+${digits}`;
}

/** WhatsApp link for a Nigerian number. */
export function whatsappHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("234") ? digits : digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}`;
}

/**
 * Makes a Cloudinary image smaller and lighter for the page (right size, best format).
 * Other addresses are returned unchanged.
 */
export function optimizeImage(url: string | null | undefined, width: number): string | null {
  if (!url) return null;
  const m = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/.exec(url);
  if (!m || /^(f_|q_|w_|c_)/.test(m[2])) return url;
  return `${m[1]}f_auto,q_auto,w_${width},c_limit/${m[2]}`;
}

export function mapsHref(address: string | null | undefined): string | null {
  return address && !address.includes("[") ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;
}

/** Placeholders like "[SCHOOL ADDRESS]" mean the school has not entered the real value yet. */
export const isPlaceholder = (value: string | null | undefined) => !value || value.includes("[");

// Nigeria is on West Africa Time all year (UTC+1, no daylight saving), so date and time boxes are read as Lagos time.
const LAGOS_OFFSET_MS = 3_600_000;

/** "2026-11-05T09:30" typed in a date-time box -> the exact moment, as Lagos time. Null if it is not a real date. */
export function parseLagosDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const utc = Date.UTC(y, mo - 1, d, h, mi) - LAGOS_OFFSET_MS;
  const date = new Date(utc);
  const back = new Date(utc + LAGOS_OFFSET_MS);
  return back.getUTCFullYear() === y && back.getUTCMonth() === mo - 1 && back.getUTCDate() === d && back.getUTCHours() === h ? date : null;
}

/** The reverse: a moment -> the text a date-time box needs, in Lagos time. */
export function toLagosInput(date: Date | null | undefined): string {
  return date ? new Date(date.getTime() + LAGOS_OFFSET_MS).toISOString().slice(0, 16) : "";
}
