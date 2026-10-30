"use server";

import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { sendEmail } from "@/lib/email";
import { getIpHash } from "@/lib/request";
import { isPlaceholder } from "@/lib/cms/helpers";
import { submitEnquiry } from "@/lib/cms/service";
import { enquiryInput } from "@/lib/validators/cms";

export type EnquiryState =
  | { ok: true }
  | { ok?: false; error?: string; fieldErrors?: Record<string, string[] | undefined> }
  | undefined;

export async function submitEnquiryAction(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  // A hidden box that people never see. Bots fill it in and get a fake "thank you".
  if (formData.get("website")) return { ok: true };

  const parsed = enquiryInput.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    interest: formData.get("interest") || undefined,
    // The admissions pop-up has no message box: its "class of interest" becomes the message.
    message: formData.get("message") ?? `Admissions enquiry from the website pop-up.${formData.get("classOfInterest") ? ` Class of interest: ${String(formData.get("classOfInterest")).slice(0, 80)}.` : ""}`,
  });
  if (!parsed.success) return { error: "Please check the highlighted boxes.", fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await submitEnquiry(parsed.data, await getIpHash());
  } catch (error) {
    if (error instanceof AppError) return { error: error.message };
    console.error("Enquiry failed", error);
    return { error: "Sorry, your message could not be sent. Please call the school instead." };
  }

  // Tell the school by email too, if email is set up. The enquiry is already safely saved either way.
  try {
    const school = await db.schoolProfile.findUnique({ where: { id: "singleton" }, select: { email: true, name: true } });
    if (school?.email && !isPlaceholder(school.email)) {
      const d = parsed.data;
      await sendEmail({
        to: school.email,
        subject: `New enquiry from ${d.name}`,
        text: `Name: ${d.name}\nPhone: ${d.phone}\nEmail: ${d.email ?? "-"}\nInterested in: ${d.interest ?? "General"}\n\n${d.message}\n\nYou can also see this in the school website's Enquiries page.`,
      });
    }
  } catch (error) {
    console.error("Enquiry email failed", error);
  }
  return { ok: true };
}
