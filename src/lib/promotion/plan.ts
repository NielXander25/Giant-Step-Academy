// Working out what yearly promotion would do. Pure and fully tested: no database, no changes made.
//
// Rules (agreed with the school):
//   - Everyone moves up one level into the SAME arm (SS2A -> SS3A) ...
//   - ... except students an Admin marked as repeating, who stay in their class.
//   - Students in a final level graduate.
//   - Students who are inactive, withdrawn or already graduated are left alone.
//   - A student already enrolled in the new session is left alone (so running it twice does nothing twice).
//   - A class's destination can be overridden by an Admin (another class, or "graduate").

export type LevelRow = { id: string; name: string; nextLevelId: string | null; isFinal: boolean };
export type ClassRow = { id: string; name: string; levelId: string; arm: string; isActive: boolean };
export type EnrollmentRow = { id: string; studentId: string; classId: string; isRepeater: boolean; studentActive: boolean };

export type Target =
  | { kind: "CLASS"; classId: string; className: string }
  | { kind: "CREATE"; levelId: string; arm: string; name: string }
  | { kind: "GRADUATE" }
  | { kind: "BLOCKED"; reason: string };

export type ClassPlan = {
  sourceClassId: string;
  sourceClassName: string;
  eligible: number; // students who will be processed
  repeaters: number;
  promoted: number; // moving up (or graduating) through the destination below
  target: Target; // where non-repeating students go
  alreadyInNewSession: number;
  inactive: number;
  notPromoted: number; // students left behind because the destination is blocked
};

export type Operation = { enrollmentId: string; studentId: string; kind: "PROMOTE" | "REPEAT" | "GRADUATE"; targetClassId?: string; createKey?: string };

export type Plan = {
  classes: ClassPlan[];
  operations: Operation[];
  /** Classes that must be created first, keyed by `${levelId}:${arm}`. */
  newClasses: { key: string; levelId: string; arm: string; name: string }[];
  totals: { promote: number; repeat: number; graduate: number; notPromoted: number; alreadyInNewSession: number; inactive: number; classesToCreate: number };
};

export type Overrides = Record<string, string>; // sourceClassId -> target classId, or "GRADUATE"

export function planPromotion(input: {
  levels: LevelRow[];
  classes: ClassRow[];
  enrollments: EnrollmentRow[];
  alreadyInNewSession: Set<string>; // studentIds
  overrides?: Overrides;
}): Plan {
  const levelById = new Map(input.levels.map((l) => [l.id, l]));
  const classById = new Map(input.classes.map((c) => [c.id, c]));
  const overrides = input.overrides ?? {};
  const bySource = new Map<string, EnrollmentRow[]>();
  for (const e of input.enrollments) (bySource.get(e.classId) ?? bySource.set(e.classId, []).get(e.classId)!).push(e);

  const operations: Operation[] = [];
  const created = new Map<string, { key: string; levelId: string; arm: string; name: string }>();
  const classPlans: ClassPlan[] = [];
  const totals = { promote: 0, repeat: 0, graduate: 0, notPromoted: 0, alreadyInNewSession: 0, inactive: 0, classesToCreate: 0 };

  const sources = [...bySource.keys()].map((id) => classById.get(id)).filter((c): c is ClassRow => Boolean(c))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  for (const cls of sources) {
    const list = bySource.get(cls.id)!;
    const inactive = list.filter((e) => !e.studentActive);
    const live = list.filter((e) => e.studentActive);
    const already = live.filter((e) => input.alreadyInNewSession.has(e.studentId));
    const eligible = live.filter((e) => !input.alreadyInNewSession.has(e.studentId));
    const repeaters = eligible.filter((e) => e.isRepeater);
    const movers = eligible.filter((e) => !e.isRepeater);

    // Where do the students who are NOT repeating go?
    let target: Target;
    const chosen = overrides[cls.id];
    if (chosen === "GRADUATE") target = { kind: "GRADUATE" };
    else if (chosen) {
      const t = classById.get(chosen);
      target = !t ? { kind: "BLOCKED", reason: "The class you chose no longer exists." }
        : !t.isActive ? { kind: "BLOCKED", reason: `${t.name} is disabled.` }
        : { kind: "CLASS", classId: t.id, className: t.name };
    } else {
      const level = levelById.get(cls.levelId);
      if (!level) target = { kind: "BLOCKED", reason: "This class's level could not be found." };
      else if (level.isFinal) target = { kind: "GRADUATE" };
      else if (!level.nextLevelId || !levelById.has(level.nextLevelId)) target = { kind: "BLOCKED", reason: `No next level is set for ${level.name}. Choose a destination, or mark ${level.name} as the final level.` };
      else {
        const next = levelById.get(level.nextLevelId)!;
        const same = input.classes.find((c) => c.levelId === next.id && c.arm === cls.arm);
        target = !same ? { kind: "CREATE", levelId: next.id, arm: cls.arm, name: `${next.name}${cls.arm}` }
          : !same.isActive ? { kind: "BLOCKED", reason: `${same.name} is disabled.` }
          : { kind: "CLASS", classId: same.id, className: same.name };
      }
    }

    if (target.kind === "CREATE") {
      const key = `${target.levelId}:${target.arm}`;
      if (movers.length && !created.has(key)) created.set(key, { key, levelId: target.levelId, arm: target.arm, name: target.name });
    }

    for (const e of repeaters) operations.push({ enrollmentId: e.id, studentId: e.studentId, kind: "REPEAT", targetClassId: cls.id });
    let notPromoted = 0;
    for (const e of movers) {
      if (target.kind === "BLOCKED") notPromoted++;
      else if (target.kind === "GRADUATE") operations.push({ enrollmentId: e.id, studentId: e.studentId, kind: "GRADUATE" });
      else if (target.kind === "CLASS") operations.push({ enrollmentId: e.id, studentId: e.studentId, kind: "PROMOTE", targetClassId: target.classId });
      else operations.push({ enrollmentId: e.id, studentId: e.studentId, kind: "PROMOTE", createKey: `${target.levelId}:${target.arm}` });
    }

    classPlans.push({
      sourceClassId: cls.id, sourceClassName: cls.name, eligible: eligible.length, repeaters: repeaters.length,
      promoted: movers.length - notPromoted, target, alreadyInNewSession: already.length, inactive: inactive.length, notPromoted,
    });
    totals.notPromoted += notPromoted;
    totals.alreadyInNewSession += already.length;
    totals.inactive += inactive.length;
  }

  for (const op of operations) {
    if (op.kind === "REPEAT") totals.repeat++;
    else if (op.kind === "GRADUATE") totals.graduate++;
    else totals.promote++;
  }
  totals.classesToCreate = created.size;
  return { classes: classPlans, operations, newClasses: [...created.values()], totals };
}
