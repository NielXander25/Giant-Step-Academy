import { UserRound } from "lucide-react";
import { CrestMark } from "@/components/site/school-logo";
import { FitToWidth } from "./fit-to-width";
import type { PublishedResult } from "@/lib/pin/result-data";
import { AFFECTIVE, columnMax, ordinal, PSYCHOMOTOR, RATING_MEANING, RATINGS } from "@/lib/results/report-card";

const dash = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? "—" : String(v));
const LINE = "border-[#b9cbe3]";

/**
 * The student's termly report, laid out like the school's printed card: an A4 landscape spread with the profile and
 * remarks on the left and the scores on the right. On a phone the two panels stack. Prints on A4 landscape.
 */
export function ResultSheet({ data }: { data: PublishedResult }) {
  const { school, student, summary, layout } = data;
  const cell = `border ${LINE} px-2 py-1.5`;
  const maxTotal = data.componentNames.reduce((a, c) => a + c.max, 0);
  const totalLabel = maxTotal === 100 ? "100%" : `/${maxTotal}`;

  const profile: [string, string][] = [
    ["Name", student.name],
    ["Admission No.", student.admissionNumber],
    ["Class", data.className],
    ["State of Origin", dash(student.stateOfOrigin)],
    ["Date of Birth", dash(student.dateOfBirth)],
    ...(layout.showGender ? ([["Gender", student.gender ? (student.gender === "MALE" ? "Male" : "Female") : "—"]] as [string, string][]) : []),
  ];
  const summaryCells: [string, string][] = [
    ["Session", data.sessionName],
    ["Total Score", dash(summary.totalScore)],
    ...(layout.showPosition ? ([["Position in Class", summary.position ? ordinal(summary.position) : "—"]] as [string, string][]) : []),
    ["Term", data.termName],
    ["Average Score", dash(summary.average)],
    ...(layout.showClassSize ? ([["No. in Class", dash(summary.classSize || null)]] as [string, string][]) : []),
    ["Resumption", dash(data.resumption)],
    ["Attendance", dash(summary.attendance)],
  ];

  const ratingTable = (title: string, rows: readonly { key: string; label: string }[]) => (
    <div>
      <h3 className="mb-1 text-center text-xs font-bold tracking-wider text-navy">{title}</h3>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td className={cell}>{r.label}</td>
              <td className={`${cell} w-16 text-center font-bold text-navy`}>{dash(summary.ratings[r.key as keyof typeof summary.ratings])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <FitToWidth width={1120}>
    <article className="result-card w-full rounded-xl border-4 border-[#5aa9d6] bg-white p-4 print:max-w-none print:rounded-none sm:p-5">
      {/* One landscape A4 sheet, like the printed card: tighter spacing on paper than on screen. */}
      <style>{`@media print {
        @page { size: A4 landscape; margin: 5mm; }
        .result-card { font-size: 11.5px; line-height: 1.3; padding: 8px !important; border-width: 3px !important; }
        .result-card td, .result-card th, .result-card dl > div { padding-top: 3.5px !important; padding-bottom: 3.5px !important; }
        .result-card dl > div { min-height: 0 !important; }
        .result-card table, .result-card dl, .result-card p { font-size: 11.5px !important; }
        .result-card thead { font-size: 10.5px !important; }
        .result-card h1 { font-size: 20px !important; }
        .result-card .photo { height: 86px !important; width: 72px !important; }
        .result-card section { gap: 6px !important; }
      }`}</style>

      <div className="grid grid-cols-[1fr_2fr] gap-6 print:gap-4">
        {/* Left panel */}
        <section className={`flex flex-col gap-3 border-r pr-5 print:pr-4 ${LINE}`}>
          <header className="text-center">
            <h1 className="text-2xl font-bold tracking-wide text-navy">{school.name.toUpperCase()}</h1>
            {school.motto && <p className="font-serif text-sm italic text-muted-foreground">{school.motto}</p>}
            <p className="mt-1 font-semibold text-navy">Termly Report</p>
            <p className="text-xs text-muted-foreground">{[school.phone ? `Phone: ${school.phone}` : null, school.address, school.email].filter(Boolean).join(" · ")}</p>
          </header>

          <div>
            <p className="mb-1 text-center text-sm font-semibold text-navy">Student's Profile</p>
            <div className="flex items-center justify-center gap-4">
              <div className={`photo flex h-28 w-24 items-center justify-center overflow-hidden rounded border bg-[#e8f2fa] ${LINE}`}>
                {student.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={student.photoUrl} alt={student.name} className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="size-14 text-[#9fb6d4]" aria-label="No photo" />
                )}
              </div>
              {school.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={school.logoUrl} alt={`${school.name} logo`} className="h-24 w-auto" />
              ) : (
                <CrestMark size={96} title={`${school.name} crest`} />
              )}
            </div>
          </div>

          <dl className={`border text-sm ${LINE}`}>
            {profile.map(([label, value]) => (
              <div key={label} className={`flex gap-2 border-b px-2 py-1.5 last:border-b-0 ${LINE}`}>
                <dt className="w-32 shrink-0 text-muted-foreground">{label}:</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <div>
            <h2 className="mb-1 text-center text-sm font-bold tracking-wider text-navy">TERMLY REMARKS</h2>
            <dl className={`border text-sm ${LINE}`}>
              {[
                ["Class Teacher's Com.", dash(summary.formTeacherRemark)],
                ["H.M/Princ. Com.", dash(summary.principalRemark)],
                ["Supervisor's Com.", dash(summary.supervisorRemark)],
              ].map(([label, value]) => (
                <div key={label} className={`min-h-12 border-b px-2 py-1.5 ${LINE}`}>
                  <dt className="inline text-muted-foreground">{label}: </dt>
                  <dd className="inline">{value}</dd>
                </div>
              ))}
              <div className="flex gap-2 px-2 py-1.5">
                <dt className="w-40 shrink-0 text-muted-foreground">Class Teacher's Name:</dt>
                <dd className="font-semibold">{dash(data.classTeacherName)}</dd>
              </div>
            </dl>
          </div>

          <footer className="mt-2 flex flex-col gap-3 text-sm">
            {layout.showSignatures && <p className="border-b border-muted-foreground pb-1 text-muted-foreground">Signed By: {school.principalName ?? ""}</p>}
            <p className="font-semibold text-navy">The Proprietress, {school.name}</p>
          </footer>
        </section>

        {/* Right panel */}
        <section className="flex min-w-0 flex-col gap-3">
          <dl className={`grid grid-cols-3 border-l border-t text-sm ${LINE}`}>
            {summaryCells.map(([label, value]) => (
              <div key={label} className={`flex gap-2 border-b border-r px-2 py-1.5 ${LINE}`}>
                <dt className="shrink-0 text-muted-foreground">{label}:</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <div>
            <h2 className="mb-1 text-center text-sm font-bold tracking-wider text-navy">COGNITIVE ABILITY</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-[#e8f2fa] text-left text-xs">
                  <tr>
                    <th className={cell}>Subjects</th>
                    {data.componentNames.map((c) => <th key={c.name} className={`${cell} text-center`}>{c.name}<span className="block font-normal text-muted-foreground">{columnMax(c.max, maxTotal)}</span></th>)}
                    <th className={`${cell} text-center`}>Total<span className="block font-normal text-muted-foreground">{totalLabel}</span></th>
                    <th className={`${cell} text-center`}>Class Av.<span className="block font-normal text-muted-foreground">{totalLabel}</span></th>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            {ratingTable("PSYCHOMOTOR SKILLS", PSYCHOMOTOR)}
            {ratingTable("AFFECTIVE AREAS", AFFECTIVE)}
          </div>
          <p className="text-center text-xs text-muted-foreground">Key: {RATINGS.map((g) => `${g} = ${RATING_MEANING[g]}`).join(", ")}</p>
        </section>
      </div>
      {layout.footerNote && <p className="mt-4 text-center text-xs text-muted-foreground">{layout.footerNote}</p>}
    </article>
    </FitToWidth>
  );
}
