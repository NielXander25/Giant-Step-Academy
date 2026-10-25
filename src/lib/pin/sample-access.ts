import { db } from "@/lib/db";
import type { Stage } from "@/lib/curriculum";
import { buildSampleResult } from "@/lib/pdf/sample";
import { resolveBands, resolveComponents } from "@/lib/results/config-store";
import { getReportLayout } from "@/lib/results/report-layout-store";

// The practice result. With the sample details and the sample PIN, the result page opens a MADE-UP report card,
// so staff can try the whole parent journey before any real result exists. It never reads or changes a student,
// class, result or PIN, uses no attempts and is not logged. An Admin switches it off on the Result PINs page.

export const SAMPLE_PIN = "GSA-SAMPLE";
export const SAMPLE_NAME = "Sample Student";
export const SAMPLE_COOKIE = "gsa_sample_pass";
export const SAMPLE_TERM = "sample"; // stands in for a term when no results are published yet

type PracticeStudent = {
  name: string;
  admissionNumber: string;
  stage: Stage;
  className?: string;
  gender?: "MALE" | "FEMALE";
  dateOfBirth?: string;
  remarks?: { formTeacher: string; principal: string };
};

// Every practice student opens with the sample PIN. Keys are what the cookie remembers.
export const PRACTICE_STUDENTS: Record<string, PracticeStudent> = {
  NUR: { name: SAMPLE_NAME, admissionNumber: "SAMPLE-NUR", stage: "NURSERY" },
  PRI: { name: SAMPLE_NAME, admissionNumber: "SAMPLE-PRI", stage: "PRIMARY" },
  JSS: { name: SAMPLE_NAME, admissionNumber: "SAMPLE-JSS", stage: "JSS" },
  SS: { name: SAMPLE_NAME, admissionNumber: "SAMPLE-SS", stage: "SS" },
  TUNDE1: { name: "Tunde Ajayi", admissionNumber: "DEMO/SS1/001", stage: "SS", className: "SS1A", gender: "MALE", dateOfBirth: "9 June 2011",
    remarks: { formTeacher: "Tunde has settled well into senior school. Good effort.", principal: "A promising start. Keep it up." } },
  TUNDE2: { name: "Tunde Ajayi", admissionNumber: "DEMO/SS2/001", stage: "SS", className: "SS2A", gender: "MALE", dateOfBirth: "9 June 2011",
    remarks: { formTeacher: "Steady improvement this term. Tunde participates well in class.", principal: "Good work. Aim for the top." } },
  TUNDE3: { name: "Tunde Ajayi", admissionNumber: "DEMO/SS3/001", stage: "SS", className: "SS3A", gender: "MALE", dateOfBirth: "9 June 2011",
    remarks: { formTeacher: "A focused and mature student. Well prepared for his final exams.", principal: "Excellent. We wish you success in WAEC." } },
};

/** The Sample Student's admission number for each level (shown to Admins). */
export const SAMPLE_ADMISSION: Record<Stage, string> = { NURSERY: "SAMPLE-NUR", PRIMARY: "SAMPLE-PRI", JSS: "SAMPLE-JSS", SS: "SAMPLE-SS" };

const SETTING_KEY = "portal.sampleResult";
const clean = (v: string) => v.normalize("NFKC").replace(/[\s/_-]+/g, "").toUpperCase();

export async function isSampleEnabled(): Promise<boolean> {
  const row = await db.systemSetting.findUnique({ where: { key: SETTING_KEY } });
  const v = row?.value as { enabled?: unknown } | undefined;
  return v?.enabled !== false; // on until an Admin switches it off
}

export async function setSampleEnabled(enabled: boolean, userId: string) {
  await db.systemSetting.upsert({
    where: { key: SETTING_KEY },
    update: { value: { enabled }, updatedById: userId },
    create: { key: SETTING_KEY, value: { enabled }, updatedById: userId },
  });
}

/** Which practice student the typed details ask for (its key), or null if they are not practice details. Pure. */
export function matchSample(input: { studentName: string; admissionNumber: string; pin: string }): string | null {
  if (clean(input.pin) !== clean(SAMPLE_PIN)) return null;
  const hit = Object.entries(PRACTICE_STUDENTS).find(([, p]) => clean(p.name) === clean(input.studentName) && clean(p.admissionNumber) === clean(input.admissionNumber));
  return hit?.[0] ?? null;
}

/** The cookie holds only which practice card and which term to show: nothing secret, nothing real. */
export const sampleCookieValue = (key: string, termId: string) => `${key}:${termId}`;

export function parseSampleCookie(value: string | undefined): { key: string; termId: string } | null {
  const [key, termId] = (value ?? "").split(":");
  if (!key || !Object.hasOwn(PRACTICE_STUDENTS, key)) return null;
  if (termId !== SAMPLE_TERM && !/^[0-9a-f-]{36}$/i.test(termId ?? "")) return null;
  return { key, termId };
}

/** The made-up report card, dressed in the school's real details, layout, score columns and grades. */
export async function loadSampleResult(key: string, termId: string) {
  const who = PRACTICE_STUDENTS[key];
  const [profile, layout, components, bands, term] = await Promise.all([
    db.schoolProfile.findUnique({ where: { id: "singleton" } }),
    getReportLayout(),
    resolveComponents(null),
    resolveBands(null),
    termId === SAMPLE_TERM ? null : db.term.findUnique({ where: { id: termId }, include: { session: { select: { name: true } } } }),
  ]);
  return buildSampleResult(who.stage, {
    layout,
    components,
    bands,
    seed: key,
    className: who.className,
    remarks: who.remarks,
    student: { name: who.name, admissionNumber: who.admissionNumber, ...(who.gender ? { gender: who.gender } : {}), ...(who.dateOfBirth ? { dateOfBirth: who.dateOfBirth } : {}) },
    ...(profile ? { school: { name: profile.name, motto: profile.motto, address: profile.address, phone: profile.phone, email: profile.email, logoUrl: profile.logoUrl, principalName: profile.principalName, isPlaceholder: profile.isPlaceholder } } : {}),
    ...(term ? { termName: term.name, sessionName: term.session.name } : {}),
  });
}
