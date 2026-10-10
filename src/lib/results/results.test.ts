import { describe, expect, it } from "vitest";
import { computeClass, computeStudent, computeSubject, type CalcConfig, type Component, type StudentInput } from "./calc";
import { SAMPLE_BANDS, gradeFor, validateBands } from "./grading";
import { assignPositions } from "./ranking";
import { DEFAULT_RULES, parseRules } from "./rules";

const CA: Component = { id: "ca", name: "CA", maxScore: 40 };
const EXAM: Component = { id: "exam", name: "Exam", maxScore: 60 };
const config: CalcConfig = { components: [CA, EXAM], bands: SAMPLE_BANDS, rules: DEFAULT_RULES };

describe("grade bands", () => {
  it("looks up the grade for a score", () => {
    expect(gradeFor(89.5, SAMPLE_BANDS)?.grade).toBe("A");
    expect(gradeFor(70, SAMPLE_BANDS)?.grade).toBe("A");
    expect(gradeFor(69.99, SAMPLE_BANDS)?.grade).toBe("B");
    expect(gradeFor(0, SAMPLE_BANDS)?.grade).toBe("F");
  });
  it("a score between whole-number bands gets the lower grade (79.5 in 70-79 / 80-100)", () => {
    const bands = [{ minScore: 80, maxScore: 100, grade: "A" }, { minScore: 70, maxScore: 79, grade: "B" }, { minScore: 0, maxScore: 69, grade: "C" }];
    expect(gradeFor(79.5, bands)?.grade).toBe("B");
  });
  it("accepts the sample bands", () => {
    expect(validateBands(SAMPLE_BANDS)).toEqual([]);
  });
  it("rejects overlaps, gaps at the ends, bad ranges and duplicate grades", () => {
    expect(validateBands([])).toHaveLength(1);
    expect(validateBands([{ minScore: 0, maxScore: 60, grade: "B" }, { minScore: 55, maxScore: 100, grade: "A" }]).join()).toContain("overlap");
    expect(validateBands([{ minScore: 10, maxScore: 100, grade: "A" }]).join()).toContain("start at 0");
    expect(validateBands([{ minScore: 0, maxScore: 90, grade: "A" }]).join()).toContain("reach 100");
    expect(validateBands([{ minScore: 50, maxScore: 40, grade: "A" }]).join()).toContain("minimum is higher");
    expect(validateBands([{ minScore: 0, maxScore: 49, grade: "A" }, { minScore: 50, maxScore: 100, grade: "a" }]).join()).toContain("same grade");
    expect(validateBands([{ minScore: 0, maxScore: 100, grade: " " }]).join()).toContain("enter the grade");
  });
});

describe("subject totals", () => {
  it("adds CA and exam and grades the result (the brief's example: 28 + 61 needs a 60 max)", () => {
    const r = computeSubject({ ca: 28, exam: 55 }, [CA, EXAM], SAMPLE_BANDS);
    expect(r).toMatchObject({ status: "COMPLETE", total: 83, percent: 83, grade: "A", remark: "Excellent" });
  });
  it("is MISSING with no scores and INCOMPLETE with only some", () => {
    expect(computeSubject(undefined, [CA, EXAM], SAMPLE_BANDS).status).toBe("MISSING");
    expect(computeSubject({ ca: 30 }, [CA, EXAM], SAMPLE_BANDS)).toMatchObject({ status: "INCOMPLETE", total: null, grade: null });
  });
  it("rejects scores above the maximum or below zero instead of grading them", () => {
    const over = computeSubject({ ca: 45, exam: 50 }, [CA, EXAM], SAMPLE_BANDS);
    expect(over.status).toBe("INCOMPLETE");
    expect(over.errors[0]).toContain("more than 40");
    expect(computeSubject({ ca: -1, exam: 50 }, [CA, EXAM], SAMPLE_BANDS).errors[0]).toContain("negative");
  });
  it("treats a zero score as entered (not missing)", () => {
    expect(computeSubject({ ca: 0, exam: 0 }, [CA, EXAM], SAMPLE_BANDS)).toMatchObject({ status: "COMPLETE", total: 0, grade: "F" });
  });
  it("converts to a percentage when the maximums do not add up to 100", () => {
    const r = computeSubject({ ca: 15, exam: 30 }, [{ id: "ca", name: "CA", maxScore: 20 }, { id: "exam", name: "Exam", maxScore: 40 }], SAMPLE_BANDS);
    expect(r).toMatchObject({ total: 45, percent: 75, grade: "A" });
  });
  it("keeps decimals and rounds to 2 places", () => {
    expect(computeSubject({ ca: 12.345, exam: 40.1 }, [CA, EXAM], SAMPLE_BANDS).total).toBe(52.45);
  });
});

const student = (id: string, subjects: Record<string, { ca?: number; exam?: number }>, expected = Object.keys(subjects)): StudentInput => ({
  enrollmentId: id, expectedSubjectIds: expected, subjects,
});

describe("student totals and averages", () => {
  const full = student("s1", { maths: { ca: 30, exam: 50 }, english: { ca: 20, exam: 40 } }); // 80 and 60
  it("totals, averages and grades a complete result", () => {
    expect(computeStudent(full, config)).toMatchObject({ completeness: "COMPLETE", subjectsExpected: 2, subjectsComplete: 2, totalScore: 140, average: 70, overallGrade: "A" });
  });
  it("withholds the average when a subject is missing (default policy), but still shows the total so far", () => {
    const s = computeStudent(student("s2", { maths: { ca: 30, exam: 50 } }, ["maths", "english"]), config);
    expect(s).toMatchObject({ completeness: "INCOMPLETE", totalScore: 80, average: null, overallGrade: null });
  });
  it("uses what is available when the school chooses RANK_AVAILABLE", () => {
    const s = computeStudent(student("s2", { maths: { ca: 30, exam: 50 } }, ["maths", "english"]), { ...config, rules: { ...DEFAULT_RULES, incompletePolicy: "RANK_AVAILABLE" } });
    expect(s).toMatchObject({ completeness: "INCOMPLETE", average: 80 });
  });
  it("is MISSING when nothing has been entered or no subjects are expected", () => {
    expect(computeStudent(student("s3", {}, ["maths"]), config).completeness).toBe("MISSING");
    expect(computeStudent(student("s4", {}, []), config).completeness).toBe("MISSING");
  });
  it("a student with an elective expects that subject too", () => {
    const core = ["maths"];
    const withElective = student("s5", { maths: { ca: 30, exam: 50 } }, [...core, "biology"]);
    expect(computeStudent(withElective, config).completeness).toBe("INCOMPLETE");
  });
  it("ignores scores for subjects the student does not take", () => {
    const s = computeStudent(student("s6", { maths: { ca: 30, exam: 50 }, french: { ca: 40, exam: 60 } }, ["maths"]), config);
    expect(s).toMatchObject({ completeness: "COMPLETE", totalScore: 80, subjectsExpected: 1 });
  });
});

describe("class positions", () => {
  const ranked = [
    { id: "A", average: 89.5 },
    { id: "B", average: 86.2 },
    { id: "C", average: 86.2 },
    { id: "D", average: 81.4 },
  ];
  it("standard method matches the brief: 1, 2, 2, 4", () => {
    const p = assignPositions(ranked, "STANDARD_COMPETITION");
    expect([p.get("A"), p.get("B"), p.get("C"), p.get("D")]).toEqual([1, 2, 2, 4]);
  });
  it("dense method gives 1, 2, 2, 3", () => {
    const p = assignPositions(ranked, "DENSE");
    expect([p.get("A"), p.get("B"), p.get("C"), p.get("D")]).toEqual([1, 2, 2, 3]);
  });
  it("handles ties at the top and one student", () => {
    const p = assignPositions([{ id: "x", average: 90 }, { id: "y", average: 90 }, { id: "z", average: 50 }], "STANDARD_COMPETITION");
    expect([p.get("x"), p.get("y"), p.get("z")]).toEqual([1, 1, 3]);
    expect(assignPositions([{ id: "only", average: 10 }], "DENSE").get("only")).toBe(1);
  });
  it("only ranks students who have an average, and never ranks incomplete ones by default", () => {
    const cls = computeClass(
      [
        student("a", { m: { ca: 40, exam: 60 } }),
        student("b", { m: { ca: 20, exam: 30 } }),
        student("c", {}, ["m"]),
        student("d", { m: { ca: 40, exam: 60 } }),
      ],
      config,
    );
    const pos = Object.fromEntries(cls.map((s) => [s.enrollmentId, s.position]));
    expect(pos).toEqual({ a: 1, d: 1, b: 3, c: null });
  });
  it("ranks incomplete students too when the school allows it", () => {
    const cls = computeClass(
      [student("a", { m: { ca: 40, exam: 60 }, e: { ca: 40, exam: 60 } }), student("b", { m: { ca: 30, exam: 50 } }, ["m", "e"])],
      { ...config, rules: { tieMethod: "STANDARD_COMPETITION", incompletePolicy: "RANK_AVAILABLE" } },
    );
    expect(cls.map((s) => s.position)).toEqual([1, 2]);
  });
});

describe("rules parsing", () => {
  it("falls back to safe defaults for missing or invalid settings", () => {
    expect(parseRules({})).toEqual(DEFAULT_RULES);
    expect(parseRules({ tieMethod: "nonsense", incompletePolicy: "WITHHOLD_POSITION" })).toEqual(DEFAULT_RULES);
    expect(parseRules({ tieMethod: "DENSE", incompletePolicy: "RANK_AVAILABLE" })).toEqual({ tieMethod: "DENSE", incompletePolicy: "RANK_AVAILABLE" });
  });
});
