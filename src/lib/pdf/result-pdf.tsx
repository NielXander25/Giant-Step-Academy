import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PublishedResult } from "@/lib/pin/result-data";

const NAVY = "#0a2150";
const LINE = "#c9d5ea";
const SOFT = "#eaf0fb";
const MUTED = "#53607a";

const s = StyleSheet.create({
  page: { padding: 30, fontSize: 9.5, fontFamily: "Helvetica", color: "#0f1b33" },
  header: { alignItems: "center", borderBottomWidth: 2, borderBottomColor: NAVY, paddingBottom: 10, marginBottom: 12 },
  logo: { width: 52, height: 52, objectFit: "contain", marginBottom: 4 },
  school: { fontFamily: "Times-Bold", fontSize: 20, color: NAVY },
  motto: { fontFamily: "Times-Italic", fontSize: 10, color: MUTED, marginTop: 2 },
  contact: { fontSize: 8.5, color: MUTED, marginTop: 2, textAlign: "center" },
  title: { marginTop: 7, fontFamily: "Helvetica-Bold", fontSize: 10, letterSpacing: 1, color: NAVY, textTransform: "uppercase" },
  info: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  infoItem: { width: "50%", marginBottom: 3 },
  label: { color: MUTED },
  bold: { fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINE },
  headRow: { flexDirection: "row", backgroundColor: SOFT, borderTopWidth: 0.5, borderTopColor: LINE, borderBottomWidth: 0.5, borderBottomColor: LINE },
  cell: { paddingVertical: 4, paddingHorizontal: 4 },
  summaryRow: { flexDirection: "row", marginTop: 12, marginBottom: 10 },
  box: { flex: 1, borderWidth: 0.5, borderColor: LINE, borderRadius: 3, padding: 6, marginRight: 6, alignItems: "center" },
  boxLabel: { fontSize: 8, color: MUTED },
  boxValue: { fontFamily: "Times-Bold", fontSize: 15, color: NAVY, marginTop: 2 },
  remark: { marginBottom: 5 },
  signatures: { flexDirection: "row", marginTop: 34 },
  sign: { flex: 1, borderTopWidth: 0.5, borderTopColor: MUTED, paddingTop: 3, marginRight: 20, fontSize: 8, color: MUTED },
  footer: { position: "absolute", bottom: 18, left: 30, right: 30, textAlign: "center", fontSize: 7.5, color: MUTED },
});

const ordinal = (n: number) => {
  const sfx = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (sfx[(v - 20) % 10] || sfx[v] || sfx[0]);
};

/** The downloadable report card. Mirrors the on-screen result, using only built-in PDF fonts so it works anywhere. */
export function ResultPdf({ data, logo }: { data: PublishedResult; logo: Buffer | null }) {
  const { school, student, summary, layout } = data;
  const comps = data.componentNames.length;
  const subjectW = 3, scoreW = 1, remarkW = 2.6;

  const position = summary.position
    ? layout.showClassSize && summary.classSize ? `${ordinal(summary.position)} of ${summary.classSize}` : ordinal(summary.position)
    : "—";
  const boxes: [string, string | number][] = [
    ["Total score", summary.totalScore ?? "—"],
    ["Average", summary.average ?? "—"],
    ["Overall grade", summary.overallGrade ?? "—"],
    ...(layout.showPosition ? ([["Position", position]] as [string, string][]) : []),
  ];

  return (
    <Document title={`${student.name} - ${data.termName} ${data.sessionName}`} author={school.name}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {logo ? <Image src={logo} style={s.logo} /> : null}
          <Text style={s.school}>{school.name}</Text>
          {school.motto ? <Text style={s.motto}>{school.motto}</Text> : null}
          <Text style={s.contact}>{[school.address, school.phone, school.email].filter(Boolean).join("  |  ")}</Text>
          <Text style={s.title}>Terminal report · {data.termName}, {data.sessionName}</Text>
        </View>

        <View style={s.info}>
          <Text style={s.infoItem}><Text style={s.label}>Name: </Text><Text style={s.bold}>{student.name}</Text></Text>
          <Text style={s.infoItem}><Text style={s.label}>Admission no.: </Text><Text style={s.bold}>{student.admissionNumber}</Text></Text>
          <Text style={s.infoItem}><Text style={s.label}>Class: </Text><Text style={s.bold}>{data.className}</Text></Text>
          {layout.showGender ? <Text style={s.infoItem}><Text style={s.label}>Gender: </Text><Text style={s.bold}>{student.gender ? student.gender.toLowerCase() : "—"}</Text></Text> : null}
        </View>

        <View style={s.headRow}>
          <Text style={[s.cell, s.bold, { flex: subjectW }]}>Subject</Text>
          {data.componentNames.map((c) => <Text key={c.name} style={[s.cell, s.bold, { flex: scoreW, textAlign: "center" }]}>{c.name} /{c.max}</Text>)}
          <Text style={[s.cell, s.bold, { flex: scoreW, textAlign: "center" }]}>Total</Text>
          <Text style={[s.cell, s.bold, { flex: scoreW, textAlign: "center" }]}>Grade</Text>
          <Text style={[s.cell, s.bold, { flex: remarkW }]}>Remark</Text>
        </View>
        {data.subjects.map((sub) => (
          <View key={sub.name} style={s.row} wrap={false}>
            <Text style={[s.cell, s.bold, { flex: subjectW }]}>{sub.name}</Text>
            {Array.from({ length: comps }, (_, i) => <Text key={i} style={[s.cell, { flex: scoreW, textAlign: "center" }]}>{sub.scores[i] ?? "—"}</Text>)}
            <Text style={[s.cell, s.bold, { flex: scoreW, textAlign: "center" }]}>{sub.total ?? "—"}</Text>
            <Text style={[s.cell, s.bold, { flex: scoreW, textAlign: "center" }]}>{sub.grade ?? "—"}</Text>
            <Text style={[s.cell, { flex: remarkW }]}>{sub.remark ?? "—"}</Text>
          </View>
        ))}

        <View style={s.summaryRow} wrap={false}>
          {boxes.map(([label, value]) => (
            <View key={label} style={s.box}>
              <Text style={s.boxLabel}>{label}</Text>
              <Text style={s.boxValue}>{String(value)}</Text>
            </View>
          ))}
        </View>

        <Text style={s.remark}><Text style={s.bold}>Form Teacher's remark: </Text>{summary.formTeacherRemark ?? "—"}</Text>
        <Text style={s.remark}><Text style={s.bold}>Principal's remark: </Text>{summary.principalRemark ?? "—"}</Text>

        {layout.showSignatures ? (
          <View style={s.signatures} wrap={false}>
            <Text style={s.sign}>Form Teacher's signature</Text>
            <Text style={s.sign}>Principal's signature and stamp{school.principalName ? ` (${school.principalName})` : ""}</Text>
          </View>
        ) : null}

        <Text style={s.footer} fixed>{layout.footerNote ? `${layout.footerNote}  ·  ` : ""}{school.name}</Text>
      </Page>
    </Document>
  );
}
