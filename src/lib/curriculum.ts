import type { Prisma } from "@prisma/client";
import { SAMPLE_BANDS } from "@/lib/results/grading";

// Giant Step Academy's classes and subjects, taken from the school's own termly report cards. The class names follow
// the school magazine: Pre-Nursery, Nursery, Basic 1–6 (Primary), Basic 7–9 (Junior Secondary) and SS 1–3.
// "Set up Giant Step classes and subjects" (Admin > Classes) applies this. It only ever adds:
// nothing the school created itself is removed, and running it twice changes nothing.

export type Stage = "NURSERY" | "PRIMARY" | "JSS" | "SS";

export const STRUCTURE: { section: string; levels: { name: string; stage: Stage }[] }[] = [
  {
    section: "Nursery",
    levels: ["Pre-Nursery 1", "Pre-Nursery 2", "Nursery 1", "Nursery 2", "Nursery 3"].map((name) => ({ name, stage: "NURSERY" as const })),
  },
  { section: "Primary", levels: [1, 2, 3, 4, 5, 6].map((n) => ({ name: `Basic ${n}`, stage: "PRIMARY" as const })) },
  {
    section: "Secondary",
    levels: [
      ...[7, 8, 9].map((n) => ({ name: `Basic ${n}`, stage: "JSS" as const })),
      ...[1, 2, 3].map((n) => ({ name: `SS${n}`, stage: "SS" as const })),
    ],
  },
];

// Printed on the Primary / Basic report card. Used for Basic 1–6 (Primary) and Basic 7–9 (JSS).
const BASIC = [
  "English Studies", "Mathematics", "Basic Science", "Religion", "National Values", "Pre-vocational Studies",
  "Use of Library", "Current Affairs", "Verbal Reasoning", "Quantitative Reasoning", "Cultural & Creative Arts",
];

export const SUBJECTS_BY_STAGE: Record<Stage, string[]> = {
  NURSERY: [
    "Social Habits", "Letter Work", "Number Work", "Health Habits", "Religion", "Science Readiness",
    "Phonics", "Poems and Rhymes", "Writing", "Colouring",
  ],
  PRIMARY: [...BASIC, "History", "Physical & Health Education", "Basic Technology (Computer)"],
  JSS: [...BASIC, "History", "Intermediate Science"],
  SS: [
    "English Language", "Mathematics", "Physics", "Chemistry", "Biology", "Government", "Commerce",
    "Literature in English", "Economics", "Marketing", "Agricultural Science", "Civic Education",
    "Christian Religious Studies", "Geography", "Accounting",
  ],
};

/** The score columns on the card: 1st Test 20%, 2nd Test 20%, Exam 60%. */
export const CARD_COMPONENTS = [
  { name: "1st Test", maxScore: 20 },
  { name: "2nd Test", maxScore: 20 },
  { name: "Exam", maxScore: 60 },
];

const STAGE_OF = new Map(STRUCTURE.flatMap((s) => s.levels.map((l) => [l.name.toLowerCase(), l.stage] as const)));

/** Which report card a level uses, from its name. Null for a level the school added that is not on any card. */
export function stageOfLevel(levelName: string): Stage | null {
  const known = STAGE_OF.get(levelName.trim().toLowerCase());
  if (known) return known;
  const n = levelName.trim().toLowerCase();
  if (/^(pre-?reception|pre-?nursery|nursery|kg|kindergarten)/.test(n)) return "NURSERY";
  if (/^(primary|basic\s*[1-6]\b)/.test(n)) return "PRIMARY";
  if (/^(jss|basic\s*[7-9]\b)/.test(n)) return "JSS";
  if (/^ss/.test(n)) return "SS";
  return null;
}

/**
 * Nursery and Primary classes (everything below Basic 7) are taught by their Form Teacher alone: students, every
 * subject's scores and the remarks. Subject teachers are only assigned from Basic 7 up.
 */
export const formTeacherTeachesAll = (levelName: string) => {
  const stage = stageOfLevel(levelName);
  return stage === "NURSERY" || stage === "PRIMARY";
};

export type CurriculumResult = { levelsAdded: number; classesAdded: number; subjectsAdded: number; classSubjectsAdded: number; componentsAdded: boolean; gradesAdded: boolean };

export async function applyCurriculum(tx: Prisma.TransactionClient): Promise<CurriculumResult> {
  const result: CurriculumResult = { levelsAdded: 0, classesAdded: 0, subjectsAdded: 0, classSubjectsAdded: 0, componentsAdded: false, gradesAdded: false };

  // 1. Sections and levels, in school order (Nursery first). Levels the school added itself keep their place after these.
  const existingLevels = await tx.classLevel.findMany({ orderBy: { sortOrder: "asc" } });
  const levelByName = new Map(existingLevels.map((l) => [l.name.toLowerCase(), l]));
  const ordered: string[] = [];

  for (const [i, def] of STRUCTURE.entries()) {
    const section = await tx.section.upsert({ where: { name: def.section }, update: { sortOrder: i + 1 }, create: { name: def.section, sortOrder: i + 1 } });
    for (const l of def.levels) {
      let level = levelByName.get(l.name.toLowerCase());
      if (!level) {
        level = await tx.classLevel.create({ data: { sectionId: section.id, name: l.name, sortOrder: 0 } });
        levelByName.set(l.name.toLowerCase(), level);
        result.levelsAdded++;
      }
      ordered.push(level.id);
    }
  }
  const others = existingLevels.filter((l) => !ordered.includes(l.id)).map((l) => l.id);
  for (const [i, id] of [...ordered, ...others].entries()) await tx.classLevel.update({ where: { id }, data: { sortOrder: i + 1 } });

  // Each level leads into the next; SS3 graduates. Links the school has already set are left alone.
  const chain = STRUCTURE.flatMap((s) => s.levels).map((l) => levelByName.get(l.name.toLowerCase())!);
  const fresh = new Map((await tx.classLevel.findMany({ where: { id: { in: chain.map((l) => l.id) } } })).map((l) => [l.id, l]));
  for (let i = 0; i < chain.length; i++) {
    const level = fresh.get(chain[i].id)!;
    if (level.nextLevelId || level.isFinal) continue;
    const next = chain[i + 1];
    await tx.classLevel.update({ where: { id: level.id }, data: next ? { nextLevelId: next.id } : { isFinal: true } });
  }

  // 2. Every level has at least an "A" arm.
  for (const level of chain) {
    const has = await tx.schoolClass.count({ where: { levelId: level.id } });
    if (has === 0) {
      await tx.schoolClass.create({ data: { levelId: level.id, arm: "A", name: `${level.name}A` } });
      result.classesAdded++;
    }
  }

  // 3. Subjects (matched by name, ignoring capitals) and which classes offer them.
  const wanted = [...new Set(Object.values(SUBJECTS_BY_STAGE).flat())];
  const subjects = await tx.subject.findMany();
  const subjectByName = new Map(subjects.map((s) => [s.name.toLowerCase(), s]));
  for (const name of wanted) {
    if (subjectByName.has(name.toLowerCase())) continue;
    subjectByName.set(name.toLowerCase(), await tx.subject.create({ data: { name } }));
    result.subjectsAdded++;
  }

  const classes = await tx.schoolClass.findMany({ include: { level: { select: { name: true } } } });
  const links: { classId: string; subjectId: string }[] = [];
  for (const cls of classes) {
    const stage = stageOfLevel(cls.level.name);
    if (!stage) continue;
    for (const name of SUBJECTS_BY_STAGE[stage]) links.push({ classId: cls.id, subjectId: subjectByName.get(name.toLowerCase())!.id });
  }
  if (links.length) result.classSubjectsAdded = (await tx.classSubject.createMany({ data: links, skipDuplicates: true })).count;

  // 4. The card's score columns and a grade scale, only if the school has not set its own yet.
  const anyComponents = await tx.assessmentComponent.count({ where: { isActive: true } });
  if (anyComponents === 0 && (await tx.resultEntry.count()) === 0) {
    await tx.assessmentComponent.createMany({ data: CARD_COMPONENTS.map((c, i) => ({ ...c, sectionId: null, sortOrder: i })) });
    result.componentsAdded = true;
  }
  if ((await tx.gradingScheme.count()) === 0) {
    const scheme = await tx.gradingScheme.create({ data: { name: "School grading", sectionId: null } });
    await tx.gradeBand.createMany({ data: SAMPLE_BANDS.map((b, i) => ({ schemeId: scheme.id, minScore: b.minScore, maxScore: b.maxScore, grade: b.grade, remark: b.remark ?? null, sortOrder: i })) });
    result.gradesAdded = true;
  }

  return result;
}
