import { describe, expect, it } from "vitest";
import { eventInput, enquiryInput, newsInput, announcementInput, galleryBulkInput } from "@/lib/validators/cms";
import { parseLagosDateTime, toLagosInput } from "./helpers";
import { makeUploadTicket, signParams } from "./upload-sign";

describe("signed picture uploads", () => {
  it("matches Cloudinary's published example signature", () => {
    const sig = signParams({ eager: "w_400,h_300,c_pad|w_260,h_200,c_crop", public_id: "sample_image", timestamp: 1315060510 }, "abcd");
    expect(sig).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e");
  });
  it("only hands out a ticket when all three Cloudinary settings exist, and never includes the secret", () => {
    expect(makeUploadTicket({ cloudName: "c", apiKey: "k" })).toBeNull();
    const t = makeUploadTicket({ cloudName: "demo", apiKey: "123", apiSecret: "topsecret" }, 1_700_000_000_000)!;
    expect(t).toMatchObject({ cloudName: "demo", apiKey: "123", timestamp: 1_700_000_000, folder: "giant-step" });
    expect(JSON.stringify(t)).not.toContain("topsecret");
    expect(t.signature).toBe(signParams({ allowed_formats: t.allowedFormats, folder: "giant-step", timestamp: 1_700_000_000 }, "topsecret"));
  });
});

describe("Nigerian (Lagos) date and time", () => {
  it("reads a date-time box as Lagos time (UTC+1) and writes it back the same", () => {
    const d = parseLagosDateTime("2026-11-05T09:30")!;
    expect(d.toISOString()).toBe("2026-11-05T08:30:00.000Z");
    expect(toLagosInput(d)).toBe("2026-11-05T09:30");
  });
  it("rejects impossible or badly formed dates", () => {
    for (const bad of ["2026-02-30T10:00", "2026-13-01T10:00", "2026-11-05", "tomorrow", "2026-11-05T25:00"]) expect(parseLagosDateTime(bad)).toBeNull();
    expect(parseLagosDateTime("")).toBeNull();
  });
});

describe("what the content manager accepts", () => {
  const ok = { title: "Open day", startsAt: "2026-11-05T09:00", status: "PUBLISHED" };
  it("events need a start, and the end must come after it", () => {
    expect(eventInput.safeParse(ok).success).toBe(true);
    expect(eventInput.safeParse({ ...ok, startsAt: "" }).success).toBe(false);
    expect(eventInput.safeParse({ ...ok, endsAt: "2026-11-05T08:00" }).success).toBe(false);
    expect(eventInput.safeParse({ ...ok, endsAt: "2026-11-05T12:00" }).success).toBe(true);
  });
  it("pictures must be secure web addresses", () => {
    const base = { title: "Hello there", content: "Text", status: "DRAFT" };
    expect(newsInput.safeParse({ ...base, coverImageUrl: "https://res.cloudinary.com/x/a.jpg" }).success).toBe(true);
    expect(newsInput.safeParse({ ...base, coverImageUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(newsInput.safeParse({ ...base, coverImageUrl: "http://insecure.com/a.jpg" }).success).toBe(false);
    expect(galleryBulkInput.safeParse({ images: [{ url: "data:image/png;base64,AAAA" }] }).success).toBe(false);
    expect(galleryBulkInput.safeParse({ images: Array.from({ length: 21 }, () => ({ url: "https://x.com/a.jpg" })) }).success).toBe(false);
  });
  it("announcements cannot end before they start", () => {
    expect(announcementInput.safeParse({ title: "Notice", message: "Hello", startsAt: "2026-11-05T09:00", endsAt: "2026-11-04T09:00", status: "PUBLISHED" }).success).toBe(false);
  });
  it("the public enquiry form needs a name, a phone number and a message, and tolerates a missing email", () => {
    const good = { name: "Ada Obi", phone: "0813 913 9020", message: "Do you have space in Primary 3?" };
    expect(enquiryInput.safeParse(good).success).toBe(true);
    expect(enquiryInput.safeParse({ ...good, phone: "abc" }).success).toBe(false);
    expect(enquiryInput.safeParse({ ...good, email: "not-an-email" }).success).toBe(false);
    expect(enquiryInput.safeParse({ ...good, message: "" }).success).toBe(false);
    expect(enquiryInput.safeParse({ ...good, interest: "Hacking" }).success).toBe(false);
  });
});
