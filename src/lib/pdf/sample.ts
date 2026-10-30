import { CARD_COMPONENTS, SUBJECTS_BY_STAGE, type Stage } from "@/lib/curriculum";
import { round2 } from "@/lib/results/calc";
import { gradeFor, SAMPLE_BANDS, type GradeBand } from "@/lib/results/grading";
import { DEFAULT_LAYOUT, type ReportLayout } from "@/lib/results/report-layout";
import type { PublishedResult } from "@/lib/pin/result-data";

// Made-up report cards, used for previews, tests and the practice PIN on the result page.
// Never mixed with real data: nothing here is read from or written to any class or student.

export const SAMPLE_CLASS: Record<Stage, string> = { NURSERY: "Nursery 2A", PRIMARY: "Basic 4A", JSS: "Basic 8A", SS: "SS2A" };

// A small repeatable "random" number per subject, so the sample looks the same every time.
function seeded(text: string) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

type SampleOptions = {
  school?: PublishedResult["school"];
  layout?: ReportLayout;
  components?: { name: string; maxScore: number }[];
  bands?: GradeBand[];
  sessionName?: string;
  termName?: string;
  /** Who the made-up card is for, and in which class. Different seeds give different (but repeatable) scores. */
  student?: Partial<PublishedResult["student"]>;
  className?: string;
  seed?: string;
  remarks?: { formTeacher: string; principal: string };
};

const SAMPLE_SCHOOL: PublishedResult["school"] = {
  name: "Giant Step Academy", motto: "Securing a bright future", address: "[SCHOOL ADDRESS]", phone: "[SCHOOL PHONE]",
  email: null, logoUrl: null, principalName: null, isPlaceholder: true,
};

export function buildSampleResult(stage: Stage, o: SampleOptions = {}): PublishedResult {
  const components = o.components?.length ? o.components : CARD_COMPONENTS;
  const bands = o.bands?.length ? o.bands : SAMPLE_BANDS;
  const maxTotal = components.reduce((a, c) => a + c.maxScore, 0);

  const subjects = SUBJECTS_BY_STAGE[stage].map((name) => {
    const rnd = seeded(`${o.seed ?? stage}:${name}`);
    const level = 0.55 + rnd() * 0.4; // this student scores 55–95% in the subject
    const scores = components.map((c) => Math.min(c.maxScore, Math.round(c.maxScore * Math.min(1, level + (rnd() - 0.5) * 0.15))));
    const total = scores.reduce((a, b) => a + b, 0);
    const band = gradeFor((total / maxTotal) * 100, bands);
    return {
      name, scores, total,
      classAverage: round2(maxTotal * (0.5 + rnd() * 0.2)),
      position: 1 + Math.floor(rnd() * 12),
      grade: band?.grade ?? null,
      remark: band?.remark ?? null,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const totalScore = subjects.reduce((a, s) => a + s.total, 0);
  const average = round2(subjects.reduce((a, s) => a + (s.total / maxTotal) * 100, 0) / subjects.length);

  return {
    layout: o.layout ?? DEFAULT_LAYOUT,
    school: o.school ?? SAMPLE_SCHOOL,
    student: {
      name: "Sample Student", admissionNumber: `SAMPLE-${stage === "NURSERY" ? "NUR" : stage === "PRIMARY" ? "PRI" : stage}`, gender: "FEMALE",
      dateOfBirth: "14 March 2015", stateOfOrigin: "Kaduna", photoUrl: null, ...o.student,
    },
    className: o.className ?? SAMPLE_CLASS[stage],
    classTeacherName: "Mrs. Sample Teacher",
    sessionName: o.sessionName ?? "2026/2027",
    termName: o.termName ?? "First Term",
    resumption: "5 January 2027",
    componentNames: components.map((c) => ({ name: c.name, max: c.maxScore })),
    subjects,
    summary: {
      totalScore, average, overallGrade: gradeFor(average, bands)?.grade ?? null, position: o.seed ? 1 + Math.floor(seeded(o.seed)() * 10) : 3, classSize: 28,
      attendance: "112 of 120",
      ratings: { sports: "B", craftWork: "A", speechComposition: "B", drawingPainting: "A", socialBehaviour: "A", neatness: "B", punctuality: "A", attentiveness: "B" },
      formTeacherRemark: o.remarks?.formTeacher ?? "A hardworking and well-behaved pupil. Keep it up.",
      principalRemark: o.remarks?.principal ?? "A good result. Aim higher next term.",
      supervisorRemark: null,
    },
  };
}

/** The sample used by tests and the Admin's sample PDF. */
export const SAMPLE_RESULT: PublishedResult = buildSampleResult("SS");
