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
export const SAMPLE_ADMISSION: Record<Stage, string> = { NURSERY: "SAMPLE-NUR", PRIMARY: "SAMPLE-PRI", JSS: "SAMPLE-JSS", SS: "SAMPLE-SS" };
export const SAMPLE_COOKIE = "gsa_sample_pass";
export const SAMPLE_TERM = "sample"; // stands in for a term when no results are published yet

const SETTING_KEY = "portal.sampleResult";
const STAGES = Object.keys(SAMPLE_ADMISSION) as Stage[];
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

/** Which sample card the typed details ask for, or null if they are not the sample details. Pure. */
export function matchSample(input: { studentName: string; admissionNumber: string; pin: string }): Stage | null {
  if (clean(input.pin) !== clean(SAMPLE_PIN)) return null;
  if (clean(input.studentName) !== clean(SAMPLE_NAME)) return null;
  return STAGES.find((s) => clean(SAMPLE_ADMISSION[s]) === clean(input.admissionNumber)) ?? null;
}

/** The cookie holds only which sample card and which term to show: nothing secret, nothing real. */
export const sampleCookieValue = (stage: Stage, termId: string) => `${stage}:${termId}`;

export function parseSampleCookie(value: string | undefined): { stage: Stage; termId: string } | null {
  const [stage, termId] = (value ?? "").split(":");
  if (!STAGES.includes(stage as Stage)) return null;
  if (termId !== SAMPLE_TERM && !/^[0-9a-f-]{36}$/i.test(termId ?? "")) return null;
  return { stage: stage as Stage, termId };
}

/** The made-up report card, dressed in the school's real details, layout, score columns and grades. */
export async function loadSampleResult(stage: Stage, termId: string) {
  const [profile, layout, components, bands, term] = await Promise.all([
    db.schoolProfile.findUnique({ where: { id: "singleton" } }),
    getReportLayout(),
    resolveComponents(null),
    resolveBands(null),
    termId === SAMPLE_TERM ? null : db.term.findUnique({ where: { id: termId }, include: { session: { select: { name: true } } } }),
  ]);
  const result = buildSampleResult(stage, {
    layout,
    components,
    bands,
    ...(profile ? { school: { name: profile.name, motto: profile.motto, address: profile.address, phone: profile.phone, email: profile.email, logoUrl: profile.logoUrl, principalName: profile.principalName, isPlaceholder: profile.isPlaceholder } } : {}),
    ...(term ? { termName: term.name, sessionName: term.session.name } : {}),
  });
  return { ...result, student: { ...result.student, admissionNumber: SAMPLE_ADMISSION[stage] } };
}
