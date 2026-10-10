import { gradeFor, type GradeBand } from "./grading";
import { assignPositions } from "./ranking";
import type { ResultRules } from "./rules";

// The result calculation engine. Pure functions: no database, no randomness.
// The school's rules (components, grade bands, tie method, incomplete policy) are passed in.

export type Component = { id: string; name: string; maxScore: number };
export type SubjectScores = Record<string, number | null | undefined>;

export type SubjectStatus = "MISSING" | "INCOMPLETE" | "COMPLETE";

export type SubjectResult = {
  status: SubjectStatus;
  total: number | null; // sum of the components, only when every component has a valid score
  percent: number | null; // total as a percentage of the maximum possible
  grade: string | null;
  remark: string | null;
  errors: string[];
};

export type Completeness = "MISSING" | "INCOMPLETE" | "COMPLETE";

export type StudentInput = {
  enrollmentId: string;
  /** The subjects this student must have: the class's compulsory subjects plus their electives. */
  expectedSubjectIds: string[];
  subjects: Record<string, SubjectScores | undefined>;
};

export type StudentSummary = {
  enrollmentId: string;
  completeness: Completeness;
  subjectsExpected: number;
  subjectsComplete: number;
  totalScore: number | null; // sum of completed subject totals
  average: number | null; // out of 100
  overallGrade: string | null;
  position: number | null;
  subjects: Record<string, SubjectResult>;
};

export type CalcConfig = { components: Component[]; bands: GradeBand[]; rules: ResultRules };

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function computeSubject(scores: SubjectScores | undefined, components: Component[], bands: GradeBand[]): SubjectResult {
  const errors: string[] = [];
  let entered = 0;
  let valid = 0;
  let total = 0;
  let maxTotal = 0;

  for (const c of components) {
    maxTotal += c.maxScore;
    const raw = scores?.[c.id];
    if (raw === null || raw === undefined) continue;
    entered++;
    if (!Number.isFinite(raw)) errors.push(`${c.name} is not a number.`);
    else if (raw < 0) errors.push(`${c.name} cannot be negative.`);
    else if (raw > c.maxScore) errors.push(`${c.name} cannot be more than ${c.maxScore}.`);
    else {
      valid++;
      total += raw;
    }
  }

  if (entered === 0) return { status: "MISSING", total: null, percent: null, grade: null, remark: null, errors };
  if (valid < components.length || maxTotal <= 0) return { status: "INCOMPLETE", total: null, percent: null, grade: null, remark: null, errors };

  const rounded = round2(total);
  const percent = round2((total / maxTotal) * 100);
  const band = gradeFor(percent, bands);
  return { status: "COMPLETE", total: rounded, percent, grade: band?.grade ?? null, remark: band?.remark ?? null, errors };
}

export function computeStudent(input: StudentInput, config: CalcConfig): Omit<StudentSummary, "position"> {
  const subjects: Record<string, SubjectResult> = {};
  for (const id of input.expectedSubjectIds) {
    subjects[id] = computeSubject(input.subjects[id], config.components, config.bands);
  }

  const results = Object.values(subjects);
  const complete = results.filter((s) => s.status === "COMPLETE");
  const anyEntered = results.some((s) => s.status !== "MISSING");
  const expected = input.expectedSubjectIds.length;

  const completeness: Completeness =
    expected > 0 && complete.length === expected ? "COMPLETE" : anyEntered ? "INCOMPLETE" : "MISSING";

  const totalScore = complete.length ? round2(complete.reduce((sum, s) => sum + (s.total ?? 0), 0)) : null;

  // An average is only given for finished results, unless the school chose to use what is available.
  const mayAverage = completeness === "COMPLETE" || (completeness === "INCOMPLETE" && config.rules.incompletePolicy === "RANK_AVAILABLE");
  const average = mayAverage && complete.length ? round2(complete.reduce((sum, s) => sum + (s.percent ?? 0), 0) / complete.length) : null;
  const overallGrade = average === null ? null : (gradeFor(average, config.bands)?.grade ?? null);

  return { enrollmentId: input.enrollmentId, completeness, subjectsExpected: expected, subjectsComplete: complete.length, totalScore, average, overallGrade, subjects };
}

/** Calculates every student in a class and assigns positions among those who have an average. */
export function computeClass(students: StudentInput[], config: CalcConfig): StudentSummary[] {
  const summaries = students.map((s) => computeStudent(s, config));
  const positions = assignPositions(
    summaries.filter((s) => s.average !== null).map((s) => ({ id: s.enrollmentId, average: s.average as number })),
    config.rules.tieMethod,
  );
  return summaries.map((s) => ({ ...s, position: positions.get(s.enrollmentId) ?? null }));
}
