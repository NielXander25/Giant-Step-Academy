// Fetches the school logo so it can be placed in the PDF. A missing or broken logo must never stop a report from downloading.

const cache = new Map<string, { at: number; data: Buffer | null }>();
const TTL_MS = 10 * 60_000;
const MAX_BYTES = 1_000_000;

/** Only public https addresses: no localhost and no raw IP addresses. */
export function isSafeLogoUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
    if (/^[\d.]+$/.test(host) || host.includes(":")) return false; // IPv4 or IPv6 literal
    return true;
  } catch {
    return false;
  }
}

export async function fetchLogo(url: string | null | undefined): Promise<Buffer | null> {
  if (!url || !isSafeLogoUrl(url)) return null;
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;

  let data: Buffer | null = null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000), redirect: "follow" });
    const type = res.headers.get("content-type") ?? "";
    if (res.ok && /image\/(png|jpe?g)/i.test(type)) {
      const bytes = Buffer.from(await res.arrayBuffer());
      if (bytes.length > 0 && bytes.length <= MAX_BYTES) data = bytes;
    }
  } catch {
    data = null;
  }
  cache.set(url, { at: Date.now(), data });
  return data;
}
