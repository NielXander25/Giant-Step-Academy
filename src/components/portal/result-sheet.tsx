import type { PublishedResult } from "@/lib/pin/result-data";

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const Placeholder = ({ text }: { text: string }) => <span className="text-muted-foreground">{text}</span>;

/** The student's report card. Designed to print cleanly on A4. */
export function ResultSheet({ data }: { data: PublishedResult }) {
  const { school, student, summary, layout } = data;
  const cell = "border border-border px-2 py-1.5";

  return (
    <article className="mx-auto w-full max-w-3xl rounded-xl border border-border bg-white p-5 print:max-w-none print:rounded-none print:border-0 print:p-0 sm:p-8">
      <style>{"@media print { @page { size: A4; margin: 12mm; } }"}</style>

      <header className="flex flex-col items-center gap-1 border-b-2 border-navy pb-4 text-center">
        {school.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={school.logoUrl} alt="" className="mb-1 h-16 w-auto" />
        ) : (
          <div className="mb-1 flex size-14 items-center justify-center rounded-full border border-dashed border-input text-[10px] text-muted-foreground">LOGO</div>
        )}
        <h1 className="font-serif text-2xl text-navy sm:text-3xl">{school.name}</h1>
        {school.motto && <p className="text-sm italic text-muted-foreground">{school.motto}</p>}
        <p className="text-xs text-muted-foreground">{[school.address, school.phone, school.email].filter(Boolean).join(" · ")}</p>
        <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-navy">Terminal report · {data.termName}, {data.sessionName}</p>
      </header>

      <section className="my-4 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
        <p><span className="text-muted-foreground">Name: </span><strong>{student.name}</strong></p>
        <p><span className="text-muted-foreground">Admission no.: </span><strong>{student.admissionNumber}</strong></p>
        <p><span className="text-muted-foreground">Class: </span><strong>{data.className}</strong></p>
        {layout.showGender && <p><span className="text-muted-foreground">Gender: </span><strong>{student.gender ? student.gender.toLowerCase() : "—"}</strong></p>}
      </section>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-primary-soft text-left text-xs uppercase tracking-wide">
            <tr>
              <th className={cell}>Subject</th>
              {data.componentNames.map((c) => <th key={c.name} className={`${cell} text-center`}>{c.name}<span className="block font-normal normal-case text-muted-foreground">/{c.max}</span></th>)}
              <th className={`${cell} text-center`}>Total</th>
              <th className={`${cell} text-center`}>Grade</th>
              <th className={cell}>Remark</th>
            </tr>
          </thead>
          <tbody>
            {data.subjects.map((s) => (
              <tr key={s.name}>
                <td className={`${cell} font-medium`}>{s.name}</td>
                {s.scores.map((v, i) => <td key={i} className={`${cell} text-center`}>{v ?? "—"}</td>)}
                <td className={`${cell} text-center font-semibold`}>{s.total ?? "—"}</td>
                <td className={`${cell} text-center font-semibold`}>{s.grade ?? "—"}</td>
                <td className={cell}>{s.remark ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className={`my-4 grid grid-cols-2 gap-3 text-center ${layout.showPosition ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
        {[
          ["Total score", summary.totalScore ?? "—"],
          ["Average", summary.average ?? "—"],
          ["Overall grade", summary.overallGrade ?? "—"],
          ...(layout.showPosition ? [["Position", summary.position ? `${ordinal(summary.position)}${layout.showClassSize && summary.classSize ? ` of ${summary.classSize}` : ""}` : "—"]] : []),
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-lg border border-border p-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-serif text-xl text-navy">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-3 text-sm">
        <p><strong>Form Teacher's remark: </strong>{summary.formTeacherRemark ?? <Placeholder text="—" />}</p>
        <p><strong>Principal's remark: </strong>{summary.principalRemark ?? <Placeholder text="—" />}</p>
      </section>

      {layout.showSignatures && (
        <footer className="mt-8 grid grid-cols-2 gap-8 text-xs text-muted-foreground">
          <p className="border-t border-border pt-1">Form Teacher's signature</p>
          <p className="border-t border-border pt-1">Principal's signature and stamp{school.principalName ? ` (${school.principalName})` : ""}</p>
        </footer>
      )}
      {layout.footerNote && <p className="mt-4 text-center text-xs text-muted-foreground">{layout.footerNote}</p>}
    </article>
  );
}
