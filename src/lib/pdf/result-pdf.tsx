import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PublishedResult } from "@/lib/pin/result-data";
import { AFFECTIVE, columnMax, ordinal, PSYCHOMOTOR, RATING_MEANING, RATINGS } from "@/lib/results/report-card";

// Laid out like Giant Step's printed termly report: profile and summary at the top, the cognitive ability
// table, psychomotor skills and affective areas side by side, then the termly remarks and the Proprietress's line.

const NAVY = "#0a2150";
const FRAME = "#5aa9d6";
const LINE = "#b9cbe3";
const SOFT = "#e8f2fa";
const MUTED = "#53607a";

const s = StyleSheet.create({
  page: { padding: 22, fontSize: 8.8, fontFamily: "Helvetica", color: "#0f1b33" },
  frame: { borderWidth: 2.5, borderColor: FRAME, padding: 12, flexGrow: 1 },
  header: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1.5, borderBottomColor: NAVY, paddingBottom: 8, marginBottom: 8 },
  logo: { width: 50, height: 50, objectFit: "contain", marginRight: 10 },
  school: { fontFamily: "Helvetica-Bold", fontSize: 17, color: NAVY, letterSpacing: 0.5 },
  motto: { fontFamily: "Times-Italic", fontSize: 9.5, color: MUTED, marginTop: 1 },
  contact: { fontSize: 8, color: MUTED, marginTop: 2 },
  title: { fontFamily: "Helvetica-Bold", fontSize: 11, color: NAVY, marginTop: 3 },
  top: { flexDirection: "row", marginBottom: 8 },
  photo: { width: 62, height: 74, borderWidth: 0.75, borderColor: LINE, marginRight: 8, alignItems: "center", justifyContent: "center", backgroundColor: SOFT },
  photoImg: { width: 62, height: 74, objectFit: "cover" },
  grid: { flex: 1, flexDirection: "row", flexWrap: "wrap", borderTopWidth: 0.5, borderLeftWidth: 0.5, borderColor: LINE },
  field: { width: "50%", flexDirection: "row", borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: LINE, paddingVertical: 3, paddingHorizontal: 4 },
  label: { color: MUTED, width: 74 },
  bold: { fontFamily: "Helvetica-Bold" },
  section: { fontFamily: "Helvetica-Bold", fontSize: 9.5, color: NAVY, textAlign: "center", marginBottom: 3, marginTop: 4, letterSpacing: 0.6 },
  headRow: { flexDirection: "row", backgroundColor: SOFT, borderWidth: 0.5, borderColor: LINE },
  row: { flexDirection: "row", borderLeftWidth: 0.5, borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: LINE },
  cell: { paddingVertical: 3, paddingHorizontal: 3, borderRightWidth: 0.5, borderColor: LINE },
  last: { borderRightWidth: 0 },
  sub: { fontSize: 7, color: MUTED },
  pair: { flexDirection: "row", marginTop: 8 },
  half: { flex: 1 },
  key: { fontSize: 7.5, color: MUTED, marginTop: 3, textAlign: "center" },
  remarks: { marginTop: 8, borderWidth: 0.5, borderColor: LINE },
  remarkRow: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: LINE, paddingVertical: 4, paddingHorizontal: 4 },
  remarkLabel: { width: 118, color: MUTED },
  sign: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 18 },
  signLine: { width: 170, borderTopWidth: 0.5, borderTopColor: MUTED, paddingTop: 2, fontSize: 8, color: MUTED },
  footer: { position: "absolute", bottom: 8, left: 22, right: 22, textAlign: "center", fontSize: 7, color: MUTED },
});

const dash = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? "—" : String(v));

/** The downloadable report card. Mirrors the on-screen result, using only built-in PDF fonts so it works anywhere. */
export function ResultPdf({ data, logo, photo = null }: { data: PublishedResult; logo: Buffer | null; photo?: Buffer | null }) {
  const { school, student, summary, layout } = data;
  const maxTotal = data.componentNames.reduce((a, c) => a + c.max, 0);
  const W = { subject: 3.2, score: 1, total: 1, avg: 1, pos: 0.8, grade: 0.8, comment: 1.9 };

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
    <View style={s.half}>
      <Text style={s.section}>{title}</Text>
      <View style={s.headRow}>
        <Text style={[s.cell, s.bold, { flex: 3 }]}> </Text>
        {RATINGS.map((g, i) => <Text key={g} style={[s.cell, s.bold, { flex: 0.6, textAlign: "center" }, i === RATINGS.length - 1 ? s.last : {}]}>{g}</Text>)}
      </View>
      {rows.map((r) => (
        <View key={r.key} style={s.row}>
          <Text style={[s.cell, { flex: 3 }]}>{r.label}</Text>
          {RATINGS.map((g, i) => (
            <Text key={g} style={[s.cell, s.bold, { flex: 0.6, textAlign: "center" }, i === RATINGS.length - 1 ? s.last : {}]}>
              {summary.ratings[r.key as keyof typeof summary.ratings] === g ? "X" : ""}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <Document title={`${student.name} - ${data.termName} ${data.sessionName}`} author={school.name}>
      <Page size="A4" style={s.page}>
        <View style={s.frame}>
          <View style={s.header}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {logo ? <Image src={logo} style={s.logo} /> : null}
            <View style={{ flex: 1 }}>
              <Text style={s.school}>{school.name.toUpperCase()}</Text>
              {school.motto ? <Text style={s.motto}>{school.motto}</Text> : null}
              <Text style={s.contact}>{[school.address, school.phone ? `Phone: ${school.phone}` : null, school.email].filter(Boolean).join("  |  ")}</Text>
              <Text style={s.title}>Termly Report</Text>
            </View>
          </View>

          <View style={s.top}>
            <View style={s.photo}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              {photo ? <Image src={photo} style={s.photoImg} /> : <Text style={s.sub}>Student's photo</Text>}
            </View>
            <View style={s.grid}>
              {fields.map(([label, value]) => (
                <View key={label} style={s.field}>
                  <Text style={s.label}>{label}</Text>
                  <Text style={[s.bold, { flex: 1 }]}>{value}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={s.section}>COGNITIVE ABILITY</Text>
          <View style={s.headRow} fixed>
            <Text style={[s.cell, s.bold, { flex: W.subject }]}>Subjects</Text>
            {data.componentNames.map((c) => (
              <Text key={c.name} style={[s.cell, s.bold, { flex: W.score, textAlign: "center" }]}>{c.name}{"\n"}<Text style={s.sub}>{columnMax(c.max, maxTotal)}</Text></Text>
            ))}
            <Text style={[s.cell, s.bold, { flex: W.total, textAlign: "center" }]}>Total{"\n"}<Text style={s.sub}>{maxTotal === 100 ? "100%" : `/${maxTotal}`}</Text></Text>
            <Text style={[s.cell, s.bold, { flex: W.avg, textAlign: "center" }]}>Class Av.</Text>
            {layout.showPosition ? <Text style={[s.cell, s.bold, { flex: W.pos, textAlign: "center" }]}>Pos'n</Text> : null}
            <Text style={[s.cell, s.bold, { flex: W.grade, textAlign: "center" }]}>Grade</Text>
            <Text style={[s.cell, s.bold, s.last, { flex: W.comment }]}>Comment</Text>
          </View>
          {data.subjects.map((sub) => (
            <View key={sub.name} style={s.row} wrap={false}>
              <Text style={[s.cell, s.bold, { flex: W.subject }]}>{sub.name}</Text>
              {data.componentNames.map((_, i) => <Text key={i} style={[s.cell, { flex: W.score, textAlign: "center" }]}>{dash(sub.scores[i])}</Text>)}
              <Text style={[s.cell, s.bold, { flex: W.total, textAlign: "center" }]}>{dash(sub.total)}</Text>
              <Text style={[s.cell, { flex: W.avg, textAlign: "center" }]}>{dash(sub.classAverage)}</Text>
              {layout.showPosition ? <Text style={[s.cell, { flex: W.pos, textAlign: "center" }]}>{sub.position ? ordinal(sub.position) : "—"}</Text> : null}
              <Text style={[s.cell, s.bold, { flex: W.grade, textAlign: "center" }]}>{dash(sub.grade)}</Text>
              <Text style={[s.cell, s.last, { flex: W.comment }]}>{dash(sub.remark)}</Text>
            </View>
          ))}

          <View style={s.pair} wrap={false}>
            {ratingTable("PSYCHOMOTOR SKILLS", PSYCHOMOTOR)}
            <View style={{ width: 10 }} />
            {ratingTable("AFFECTIVE AREAS", AFFECTIVE)}
          </View>
          <Text style={s.key}>Key: {RATINGS.map((g) => `${g} = ${RATING_MEANING[g]}`).join(",  ")}</Text>

          <View wrap={false}>
            <Text style={s.section}>TERMLY REMARKS</Text>
            <View style={s.remarks}>
              <View style={s.remarkRow}><Text style={s.remarkLabel}>Class Teacher's Com.:</Text><Text style={{ flex: 1 }}>{dash(summary.formTeacherRemark)}</Text></View>
              <View style={s.remarkRow}><Text style={s.remarkLabel}>H.M/Princ. Com.:</Text><Text style={{ flex: 1 }}>{dash(summary.principalRemark)}</Text></View>
              {summary.supervisorRemark ? <View style={s.remarkRow}><Text style={s.remarkLabel}>Supervisor's Com.:</Text><Text style={{ flex: 1 }}>{summary.supervisorRemark}</Text></View> : null}
              <View style={[s.remarkRow, { borderBottomWidth: 0 }]}><Text style={s.remarkLabel}>Class Teacher's Name:</Text><Text style={[s.bold, { flex: 1 }]}>{dash(data.classTeacherName)}</Text></View>
            </View>

            {layout.showSignatures ? (
              <View style={s.sign}>
                <Text style={s.signLine}>Signed by{school.principalName ? `: ${school.principalName}` : ""}</Text>
                <Text style={[s.bold, { color: NAVY }]}>The Proprietress, {school.name}</Text>
              </View>
            ) : (
              <Text style={[s.bold, { color: NAVY, textAlign: "right", marginTop: 10 }]}>The Proprietress, {school.name}</Text>
            )}
          </View>
        </View>
        <Text style={s.footer} fixed>{layout.footerNote ? `${layout.footerNote}  ·  ` : ""}{school.name}</Text>
      </Page>
    </Document>
  );
}
