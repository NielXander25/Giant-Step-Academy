// Optional Cloudflare Turnstile bot check on the result portal. Only active when TURNSTILE_SECRET_KEY is set.

export const turnstileEnabled = () => Boolean(process.env.TURNSTILE_SECRET_KEY);

export async function verifyTurnstile(token: string | null, ip?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false; // if the check cannot be reached, fail closed
  }
}
