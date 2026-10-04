// Optional email notifications through Resend (https://resend.com).
// If RESEND_API_KEY and EMAIL_FROM are not set, emails are skipped and the app works normally.

type Email = { to: string; subject: string; text: string };

export async function sendEmail({ to, subject, text }: Email): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text }),
    });
    if (!res.ok) console.error("Email provider rejected the message", res.status);
    return res.ok;
  } catch (error) {
    console.error("Email send failed", error);
    return false;
  }
}
