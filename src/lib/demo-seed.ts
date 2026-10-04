import type { Prisma } from "@prisma/client";

// SAMPLE structure so the platform can be explored before the school confirms its real classes.
// Everything here can be edited or extended on the Classes and Subjects pages.
const SECTIONS = [
  { name: "Primary", levels: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"] },
  { name: "Secondary", levels: ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"] },
];

const SUBJECTS = [
  "Mathematics", "English Language", "Basic Science", "Social Studies", "Civic Education",
  "Computer Studies", "Agricultural Science", "Physical & Health Education", "Cultural & Creative Arts",
  "Business Studies", "Biology", "Chemistry", "Physics", "Economics", "Government", "Literature in English",
];

export async function loadSampleStructure(tx: Prisma.TransactionClient) {
  const levels: { id: string }[] = [];
  let order = 0;

  for (const [i, section] of SECTIONS.entries()) {
    const s = await tx.section.upsert({
      where: { name: section.name },
      update: {},
      create: { name: section.name, sortOrder: i + 1 },
    });
    for (const name of section.levels) {
      const level = await tx.classLevel.create({ data: { sectionId: s.id, name, sortOrder: ++order } });
      await tx.schoolClass.create({ data: { levelId: level.id, arm: "A", name: `${name}A` } });
      levels.push(level);
    }
  }

  // Each level promotes to the next; the last one graduates.
  for (let i = 0; i < levels.length; i++) {
    const isLast = i === levels.length - 1;
    await tx.classLevel.update({
      where: { id: levels[i].id },
      data: isLast ? { isFinal: true } : { nextLevelId: levels[i + 1].id },
    });
  }

  await tx.subject.createMany({ data: SUBJECTS.map((name) => ({ name })), skipDuplicates: true });
  return { levels: levels.length, subjects: SUBJECTS.length };
}
