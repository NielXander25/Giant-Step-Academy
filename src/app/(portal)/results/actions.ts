"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getIpHash } from "@/lib/request";
import { PIN_RULES } from "@/lib/constants";
import { attemptAccess } from "@/lib/pin/access";
import { verifyTurnstile } from "@/lib/pin/turnstile";
import { VIEW_COOKIE } from "@/lib/pin/view-session";

export type PortalState = { error?: string } | undefined;

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
  termId: z.string().uuid(),
});

export async function openResultAction(_prev: PortalState, formData: FormData): Promise<PortalState> {
  const parsed = schema.safeParse({
    studentName: formData.get("studentName"),
    admissionNumber: formData.get("admissionNumber"),
    pin: formData.get("pin"),
    termId: formData.get("termId"),
  });
  if (!parsed.success) return { error: MESSAGES.BAD_INPUT };

  const h = await headers();
  const ipHash = await getIpHash();
  const human = await verifyTurnstile(String(formData.get("turnstileToken") ?? "") || null, h.get("x-forwarded-for")?.split(",")[0]?.trim());
  if (!human) return { error: MESSAGES.CAPTCHA };

  let result;
  try {
    result = await attemptAccess({ ...parsed.data, ipHash, userAgent: h.get("user-agent") });
  } catch (error) {
    console.error("Result portal error", error);
    return { error: MESSAGES.DOWN };
  }
  if (!result.ok) return { error: result.reason === "RATE_LIMITED" ? MESSAGES.RATE_LIMITED : result.reason === "NOT_PUBLISHED" ? MESSAGES.NOT_PUBLISHED : MESSAGES.INVALID };

  (await cookies()).set(VIEW_COOKIE, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PIN_RULES.viewSessionMinutes * 60,
  });
  redirect("/results/view");
}
