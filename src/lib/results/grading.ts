export type GradeBand = { minScore: number; maxScore: number; grade: string; remark?: string | null };

/**
 * SAMPLE grading only, so the system can be explored. It is NOT the school's official scale.
 * The Admin replaces it on the Grading settings page.
 */
export const SAMPLE_BANDS: GradeBand[] = [
  { minScore: 70, maxScore: 100, grade: "A", remark: "Excellent" },
  { minScore: 60, maxScore: 69, grade: "B", remark: "Very good" },
  { minScore: 50, maxScore: 59, grade: "C", remark: "Good" },
  { minScore: 45, maxScore: 49, grade: "D", remark: "Pass" },
  { minScore: 40, maxScore: 44, grade: "E", remark: "Fair" },
  { minScore: 0, maxScore: 39, grade: "F", remark: "Fail" },
];

/**
 * Checks a set of grade bands and returns a list of problems (empty = fine).
 * Rules: every score from 0 to 100 gets a grade, and bands never overlap.
 * Gaps between whole numbers are fine: a score of 79.5 simply gets the 70–79 grade.
 */
export function validateBands(bands: GradeBand[]): string[] {
  const errors: string[] = [];
  if (bands.length === 0) return ["Add at least one grade band."];

  for (const [i, b] of bands.entries()) {
    const n = i + 1;
    if (!Number.isFinite(b.minScore) || !Number.isFinite(b.maxScore)) errors.push(`Row ${n}: enter numbers for the minimum and maximum.`);
    else if (b.minScore < 0 || b.maxScore > 100) errors.push(`Row ${n}: scores must be between 0 and 100.`);
    else if (b.minScore > b.maxScore) errors.push(`Row ${n}: the minimum is higher than the maximum.`);
    if (!b.grade.trim()) errors.push(`Row ${n}: enter the grade (for example A).`);
  }
  if (errors.length) return errors;

  const sorted = [...bands].sort((a, b) => a.minScore - b.minScore);
  if (sorted[0].minScore !== 0) errors.push("The lowest band must start at 0 so every score gets a grade.");
  if (sorted[sorted.length - 1].maxScore < 100) errors.push("The highest band must reach 100.");
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].minScore <= sorted[i - 1].maxScore) {
      errors.push(`The bands ${sorted[i - 1].grade} and ${sorted[i].grade} overlap.`);
    }
  }
  const names = bands.map((b) => b.grade.trim().toLowerCase());
  if (new Set(names).size !== names.length) errors.push("Two bands use the same grade.");
  return errors;
}

/** The grade for a percentage: the band with the highest minimum that the score reaches. */
export function gradeFor(percent: number, bands: GradeBand[]): GradeBand | null {
  const sorted = [...bands].sort((a, b) => b.minScore - a.minScore);
  return sorted.find((b) => percent >= b.minScore) ?? null;
}
