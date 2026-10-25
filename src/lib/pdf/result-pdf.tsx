import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PublishedResult } from "@/lib/pin/result-data";
import { AFFECTIVE, columnMax, ordinal, PSYCHOMOTOR, RATING_MEANING, RATINGS } from "@/lib/results/report-card";

// Laid out like Giant Step's printed termly report: an A4 LANDSCAPE spread with two panels.
// Left: the school, the student's profile, the termly remarks and the Proprietress's line.
// Right: session and summary, the cognitive ability table, then psychomotor skills and affective areas side by side.

const NAVY = "#0a2150";
const FRAME = "#5aa9d6";
const LINE = "#b9cbe3";
const SOFT = "#e8f2fa";
const MUTED = "#53607a";

const s = StyleSheet.create({
  page: { padding: 16, fontSize: 9, fontFamily: "Helvetica", color: "#0f1b33" },
  frame: { borderWidth: 3, borderColor: FRAME, padding: 10, flexGrow: 1, flexDirection: "row" },
  left: { width: "33%", paddingRight: 10, borderRightWidth: 1, borderRightColor: LINE },
  right: { flex: 1, paddingLeft: 10 },
  header: { alignItems: "center", marginBottom: 6 },
  logo: { width: 44, height: 44, objectFit: "contain", marginBottom: 3 },
  school: { fontFamily: "Helvetica-Bold", fontSize: 15, color: NAVY, letterSpacing: 0.5, textAlign: "center" },
  motto: { fontFamily: "Times-Italic", fontSize: 8.5, color: MUTED, marginTop: 1, textAlign: "center" },
  title: { fontFamily: "Helvetica-Bold", fontSize: 11, color: NAVY, marginTop: 2 },
  contact: { fontSize: 7.5, color: MUTED, marginTop: 2, textAlign: "center" },
  profileHead: { fontFamily: "Helvetica-Bold", fontSize: 8.5, color: NAVY, textAlign: "center", marginTop: 4, marginBottom: 3 },
  photoRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 6 },
  photo: { width: 76, height: 90, borderWidth: 0.75, borderColor: LINE, alignItems: "center", justifyContent: "center", backgroundColor: SOFT },
  photoImg: { width: 76, height: 90, objectFit: "cover" },
  badge: { width: 40, height: 40, objectFit: "contain", marginLeft: 12 },
  box: { borderWidth: 0.5, borderColor: LINE },
  line: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: LINE, paddingVertical: 4.5, paddingHorizontal: 4 },
  label: { color: MUTED, width: 104 },
  bold: { fontFamily: "Helvetica-Bold" },
  section: { fontFamily: "Helvetica-Bold", fontSize: 9, color: NAVY, textAlign: "center", marginBottom: 3, marginTop: 6, letterSpacing: 0.6 },
  remark: { borderBottomWidth: 0.5, borderColor: LINE, paddingVertical: 5, paddingHorizontal: 4, minHeight: 40 },
  sign: { marginTop: 14 },
  signLine: { borderBottomWidth: 0.5, borderBottomColor: MUTED, paddingBottom: 2, color: MUTED },
  proprietress: { fontFamily: "Helvetica-Bold", color: NAVY, marginTop: 8 },
  summary: { flexDirection: "row", flexWrap: "wrap", borderTopWidth: 0.5, borderLeftWidth: 0.5, borderColor: LINE },
  sumCell: { width: "33.333%", flexDirection: "row", borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: LINE, paddingVertical: 4.5, paddingHorizontal: 4 },
  sumLabel: { color: MUTED, width: 84 },
  headRow: { flexDirection: "row", backgroundColor: SOFT, borderWidth: 0.5, borderColor: LINE },
  row: { flexDirection: "row", borderLeftWidth: 0.5, borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: LINE },
  cell: { paddingVertical: 4, paddingHorizontal: 3, borderRightWidth: 0.5, borderColor: LINE },
  last: { borderRightWidth: 0 },
  sub: { fontSize: 6.5, color: MUTED },
  pair: { flexDirection: "row", marginTop: 2 },
  half: { flex: 1 },
  key: { fontSize: 7, color: MUTED, marginTop: 3, textAlign: "center" },
  footer: { position: "absolute", bottom: 5, left: 16, right: 16, textAlign: "center", fontSize: 6.5, color: MUTED },
});

const dash = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? "—" : String(v));

/** The downloadable report card. Mirrors the on-screen result, using only built-in PDF fonts so it works anywhere. */
export function ResultPdf({ data, logo, photo = null }: { data: PublishedResult; logo: Buffer | null; photo?: Buffer | null }) {
  const { school, student, summary, layout } = data;
  const maxTotal = data.componentNames.reduce((a, c) => a + c.max, 0);
  const W = { subject: 3, score: 0.9, total: 0.9, avg: 1.1, pos: 0.7, grade: 0.7, comment: 1.7 };

  const profile: [string, string][] = [
    ["Name", student.name],
    ["Admission No.", student.admissionNumber],
    ["Class", data.className],
    ["State of Origin", dash(student.stateOfOrigin)],
    ["Date of Birth", dash(student.dateOfBirth)],
    ...(layout.showGender ? ([["Gender", student.gender ? (student.gender === "MALE" ? "Male" : "Female") : "—"]] as [string, string][]) : []),
  ];

  // Three across, as on the card: Session · Total Score · Position in Class, then Term · Average Score · No. in Class.
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
    <View style={s.half}>
      <Text style={s.section}>{title}</Text>
      {rows.map((r, i) => (
        <View key={r.key} style={[s.row, i === 0 ? { borderTopWidth: 0.5 } : {}]}>
          <Text style={[s.cell, { flex: 3 }]}>{r.label}</Text>
          <Text style={[s.cell, s.bold, s.last, { flex: 1, textAlign: "center" }]}>{dash(summary.ratings[r.key as keyof typeof summary.ratings])}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <Document title={`${student.name} - ${data.termName} ${data.sessionName}`} author={school.name}>
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.frame}>
          {/* ── Left panel ── */}
          <View style={s.left}>
            <View style={s.header}>
              <Text style={s.school}>{school.name.toUpperCase()}</Text>
              {school.motto ? <Text style={s.motto}>{school.motto}</Text> : null}
              <Text style={s.title}>Termly Report</Text>
              <Text style={s.contact}>{[school.phone ? `Phone: ${school.phone}` : null, school.address, school.email].filter(Boolean).join("  |  ")}</Text>
            </View>

            <Text style={s.profileHead}>Student's Profile</Text>
            <View style={s.photoRow}>
              <View style={s.photo}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                {photo ? <Image src={photo} style={s.photoImg} /> : <Text style={s.sub}>Photo</Text>}
              </View>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              {logo ? <Image src={logo} style={s.badge} /> : null}
            </View>

            <View style={s.box}>
              {profile.map(([label, value], i) => (
                <View key={label} style={[s.line, i === profile.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                  <Text style={s.label}>{label}:</Text>
                  <Text style={[s.bold, { flex: 1 }]}>{value}</Text>
                </View>
              ))}
            </View>

            <Text style={s.section}>TERMLY REMARKS</Text>
            <View style={s.box}>
              <View style={s.remark}><Text><Text style={s.label}>Class Teacher's Com.: </Text>{dash(summary.formTeacherRemark)}</Text></View>
              <View style={s.remark}><Text><Text style={s.label}>H.M/Princ. Com.: </Text>{dash(summary.principalRemark)}</Text></View>
              <View style={s.remark}><Text><Text style={s.label}>Supervisor's Com.: </Text>{dash(summary.supervisorRemark)}</Text></View>
              <View style={[s.line, { borderBottomWidth: 0 }]}><Text style={s.label}>Class Teacher's Name:</Text><Text style={[s.bold, { flex: 1 }]}>{dash(data.classTeacherName)}</Text></View>
            </View>

            <View style={s.sign}>
              {layout.showSignatures ? <Text style={s.signLine}>Signed By: {school.principalName ?? ""}</Text> : null}
              <Text style={s.proprietress}>The Proprietress, {school.name}</Text>
            </View>
          </View>

          {/* ── Right panel ── */}
          <View style={s.right}>
            <View style={s.summary}>
              {summaryCells.map(([label, value]) => (
                <View key={label} style={s.sumCell}>
                  <Text style={s.sumLabel}>{label}:</Text>
                  <Text style={[s.bold, { flex: 1 }]}>{value}</Text>
                </View>
              ))}
            </View>

            <Text style={s.section}>COGNITIVE ABILITY</Text>
            <View style={s.headRow}>
              <Text style={[s.cell, s.bold, { flex: W.subject }]}>Subjects</Text>
              {data.componentNames.map((c) => (
                <Text key={c.name} style={[s.cell, s.bold, { flex: W.score, textAlign: "center" }]}>{c.name}{"\n"}<Text style={s.sub}>{columnMax(c.max, maxTotal)}</Text></Text>
              ))}
              <Text style={[s.cell, s.bold, { flex: W.total, textAlign: "center" }]}>Total{"\n"}<Text style={s.sub}>{maxTotal === 100 ? "100%" : `/${maxTotal}`}</Text></Text>
              <Text style={[s.cell, s.bold, { flex: W.avg, textAlign: "center" }]}>Class Av.{"\n"}<Text style={s.sub}>{maxTotal === 100 ? "100%" : `/${maxTotal}`}</Text></Text>
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
          </View>
        </View>
        <Text style={s.footer} fixed>{layout.footerNote ? `${layout.footerNote}  ·  ` : ""}{school.name}</Text>
      </Page>
    </Document>
  );
}
