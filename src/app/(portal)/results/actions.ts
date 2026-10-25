"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getIpHash } from "@/lib/request";
import { PIN_RULES } from "@/lib/constants";
import { attemptAccess } from "@/lib/pin/access";
import { verifyTurnstile } from "@/lib/pin/turnstile";
import { VIEW_COOKIE } from "@/lib/pin/view-session";
import { isSampleEnabled, matchSample, SAMPLE_COOKIE, SAMPLE_TERM, sampleCookieValue } from "@/lib/pin/sample-access";

// What the parent typed (never the PIN) comes back with an error, so a failed try does not empty the form.
export type PortalState = { error?: string; values?: { studentName: string; admissionNumber: string; termId: string } } | undefined;

const MESSAGES = {
  INVALID: "We couldn't open a result with those details. Please check the student's full name, admission number and PIN. If the PIN has already been used twice or has expired, please ask the school office for a new one.",
  RATE_LIMITED: "Too many attempts. Please wait 15 minutes and try again.",
  NOT_PUBLISHED: "The results for this term are not available yet. Please check again later.",
  CAPTCHA: "Please complete the \"I am not a robot\" check and try again.",
  BAD_INPUT: "Please fill in every box, including the term.",
  DOWN: "The result service is not available right now. Please try again later.",
} as const;

const schema = z.object({
  studentName: z.string().trim().min(2).max(120),
  admissionNumber: z.string().trim().min(2).max(40),
  pin: z.string().trim().min(6).max(30),
  termId: z.union([z.string().uuid(), z.literal(SAMPLE_TERM)]),
});

export async function openResultAction(_prev: PortalState, formData: FormData): Promise<PortalState> {
  const values = { studentName: String(formData.get("studentName") ?? ""), admissionNumber: String(formData.get("admissionNumber") ?? ""), termId: String(formData.get("termId") ?? "") };
  const fail = (error: string): PortalState => ({ error, values });
  const parsed = schema.safeParse({
    studentName: formData.get("studentName"),
    admissionNumber: formData.get("admissionNumber"),
    pin: formData.get("pin"),
    termId: formData.get("termId"),
  });
  if (!parsed.success) return fail(MESSAGES.BAD_INPUT);

  // The practice result: made-up data only, no PIN attempt used, nothing logged or changed.
  const sample = matchSample(parsed.data);
  if (sample && (await isSampleEnabled())) {
    const jar = await cookies();
    jar.delete(VIEW_COOKIE);
    jar.set(SAMPLE_COOKIE, sampleCookieValue(sample, parsed.data.termId), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: PIN_RULES.viewSessionMinutes * 60,
    });
    redirect("/results/view");
  }
  if (parsed.data.termId === SAMPLE_TERM) return fail(MESSAGES.INVALID);
  const termId = parsed.data.termId;

  const h = await headers();
  const ipHash = await getIpHash();
  const human = await verifyTurnstile(String(formData.get("turnstileToken") ?? "") || null, h.get("x-forwarded-for")?.split(",")[0]?.trim());
  if (!human) return fail(MESSAGES.CAPTCHA);

  let result;
  try {
    result = await attemptAccess({ ...parsed.data, termId, ipHash, userAgent: h.get("user-agent") });
  } catch (error) {
    console.error("Result portal error", error);
    return fail(MESSAGES.DOWN);
  }
  if (!result.ok) return fail(result.reason === "RATE_LIMITED" ? MESSAGES.RATE_LIMITED : result.reason === "NOT_PUBLISHED" ? MESSAGES.NOT_PUBLISHED : MESSAGES.INVALID);

  const jar = await cookies();
  jar.delete(SAMPLE_COOKIE);
  jar.set(VIEW_COOKIE, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PIN_RULES.viewSessionMinutes * 60,
  });
  redirect("/results/view");
}
