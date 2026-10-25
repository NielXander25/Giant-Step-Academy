import { UserRound } from "lucide-react";
import type { PublishedResult } from "@/lib/pin/result-data";
import { AFFECTIVE, columnMax, ordinal, PSYCHOMOTOR, RATING_MEANING, RATINGS } from "@/lib/results/report-card";

const dash = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? "—" : String(v));

/** The student's termly report, laid out like the school's printed card. Designed to print cleanly on A4. */
export function ResultSheet({ data }: { data: PublishedResult }) {
  const { school, student, summary, layout } = data;
  const cell = "border border-[#b9cbe3] px-2 py-1.5";
  const maxTotal = data.componentNames.reduce((a, c) => a + c.max, 0);

  const fields: [string, string][] = [
    ["Name", student.name],
    ["Session", data.sessionName],
    ["Admission No.", student.admissionNumber],
    ["Term", data.termName],
    ["Class", data.className],
    ["Total Score", dash(summary.totalScore)],
    ["State of Origin", dash(student.stateOfOrigin)],
    ["Average Score", dash(summary.average)],
    ["Date of Birth", dash(student.dateOfBirth)],
    ...(layout.showPosition ? ([["Position in Class", summary.position ? ordinal(summary.position) : "—"]] as [string, string][]) : []),
    ...(layout.showGender ? ([["Gender", student.gender ? (student.gender === "MALE" ? "Male" : "Female") : "—"]] as [string, string][]) : []),
    ...(layout.showClassSize ? ([["No. in Class", dash(summary.classSize || null)]] as [string, string][]) : []),
    ["Attendance", dash(summary.attendance)],
    ["Resumption", dash(data.resumption)],
  ];

  const ratingTable = (title: string, rows: readonly { key: string; label: string }[]) => (
    <div>
      <h3 className="mb-1 text-center text-xs font-bold tracking-wider text-navy">{title}</h3>
      <table className="w-full border-collapse text-sm">
        <thead className="bg-[#e8f2fa]"><tr><th className={cell}><span className="sr-only">Area</span></th>{RATINGS.map((g) => <th key={g} className={`${cell} w-9 text-center`}>{g}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => {
            const given = summary.ratings[r.key as keyof typeof summary.ratings];
            return (
              <tr key={r.key}>
                <td className={cell}>{r.label}{given && <span className="sr-only">: {given}</span>}</td>
                {RATINGS.map((g) => <td key={g} aria-hidden="true" className={`${cell} text-center font-bold text-navy`}>{given === g ? "✕" : ""}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <article className="mx-auto w-full max-w-4xl rounded-xl border-4 border-[#5aa9d6] bg-white p-4 print:max-w-none print:rounded-none sm:p-6">
      <style>{"@media print { @page { size: A4; margin: 8mm; } }"}</style>

      <header className="flex items-center gap-4 border-b-2 border-navy pb-3">
        {school.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={school.logoUrl} alt="" className="h-16 w-auto" />
        )}
        <div>
          <h1 className="text-xl font-bold tracking-wide text-navy sm:text-2xl">{school.name.toUpperCase()}</h1>
          {school.motto && <p className="font-serif text-sm italic text-muted-foreground">{school.motto}</p>}
          <p className="text-xs text-muted-foreground">{[school.address, school.phone ? `Phone: ${school.phone}` : null, school.email].filter(Boolean).join(" · ")}</p>
          <p className="mt-1 font-semibold text-navy">Termly Report</p>
        </div>
      </header>

      <section className="my-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded border border-[#b9cbe3] bg-[#e8f2fa]">
          {student.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={student.photoUrl} alt={`${student.name}`} className="h-full w-full object-cover" />
          ) : (
            <UserRound className="size-14 text-[#9fb6d4]" aria-label="No photo" />
          )}
        </div>
        <dl className="grid flex-1 grid-cols-1 border-l border-t border-[#b9cbe3] text-sm sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="flex gap-2 border-b border-r border-[#b9cbe3] px-2 py-1.5">
              <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <h2 className="mb-1 text-center text-sm font-bold tracking-wider text-navy">COGNITIVE ABILITY</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead className="bg-[#e8f2fa] text-left text-xs">
            <tr>
              <th className={cell}>Subjects</th>
              {data.componentNames.map((c) => <th key={c.name} className={`${cell} text-center`}>{c.name}<span className="block font-normal text-muted-foreground">{columnMax(c.max, maxTotal)}</span></th>)}
              <th className={`${cell} text-center`}>Total<span className="block font-normal text-muted-foreground">{maxTotal === 100 ? "100%" : `/${maxTotal}`}</span></th>
              <th className={`${cell} text-center`}>Class Av.</th>
              {layout.showPosition && <th className={`${cell} text-center`}>Pos'n</th>}
              <th className={`${cell} text-center`}>Grade</th>
              <th className={cell}>Comment</th>
            </tr>
          </thead>
          <tbody>
            {data.subjects.map((s) => (
              <tr key={s.name}>
                <td className={`${cell} font-medium`}>{s.name}</td>
                {s.scores.map((v, i) => <td key={i} className={`${cell} text-center`}>{dash(v)}</td>)}
                <td className={`${cell} text-center font-semibold`}>{dash(s.total)}</td>
                <td className={`${cell} text-center`}>{dash(s.classAverage)}</td>
                {layout.showPosition && <td className={`${cell} text-center`}>{s.position ? ordinal(s.position) : "—"}</td>}
                <td className={`${cell} text-center font-semibold`}>{dash(s.grade)}</td>
                <td className={cell}>{dash(s.remark)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        {ratingTable("PSYCHOMOTOR SKILLS", PSYCHOMOTOR)}
        {ratingTable("AFFECTIVE AREAS", AFFECTIVE)}
      </section>
      <p className="mt-2 text-center text-xs text-muted-foreground">Key: {RATINGS.map((g) => `${g} = ${RATING_MEANING[g]}`).join(", ")}</p>

      <section className="mt-4">
        <h2 className="mb-1 text-center text-sm font-bold tracking-wider text-navy">TERMLY REMARKS</h2>
        <dl className="border border-[#b9cbe3] text-sm">
          {[
            ["Class Teacher's Com.", dash(summary.formTeacherRemark)],
            ["H.M/Princ. Com.", dash(summary.principalRemark)],
            ...(summary.supervisorRemark ? [["Supervisor's Com.", summary.supervisorRemark]] : []),
            ["Class Teacher's Name", dash(data.classTeacherName)],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2 border-b border-[#b9cbe3] px-2 py-1.5 last:border-b-0">
              <dt className="w-44 shrink-0 text-muted-foreground">{label}:</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="mt-8 flex flex-wrap items-end justify-between gap-6 text-sm">
        {layout.showSignatures && <p className="w-56 border-t border-muted-foreground pt-1 text-xs text-muted-foreground">Signed by{school.principalName ? `: ${school.principalName}` : ""}</p>}
        <p className="font-semibold text-navy">The Proprietress, {school.name}</p>
      </footer>
      {layout.footerNote && <p className="mt-4 text-center text-xs text-muted-foreground">{layout.footerNote}</p>}
    </article>
  );
}
