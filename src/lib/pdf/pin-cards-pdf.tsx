import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { PIN_RULES } from "@/lib/constants";

// Printable result-checker PINs: A4 portrait, ten numbered cut-out cards a page, then a register page where the school
// office records who received each PIN. Made only at the moment PINs are created, the one time they exist in plain form.

const NAVY = "#142a4c";
const MAROON = "#800020";
const GOLD = "#d9a520";
const CREAM = "#fcf7f1";
const LINE = "#d9d0c3";
const MUTED = "#586273";

const PER_PAGE = 10;

export type PinCardsData = {
  pins: string[];
  label: string | null;
  createdAt: Date;
  school: { name: string; motto: string | null; phone: string | null; website: string };
  crest: Buffer;
};

const s = StyleSheet.create({
  page: { paddingTop: 22, paddingBottom: 30, paddingHorizontal: 26, fontFamily: "Helvetica", fontSize: 8, color: NAVY, backgroundColor: "#ffffff" },
  header: { flexDirection: "row", alignItems: "center", paddingBottom: 8, marginBottom: 10, borderBottomWidth: 2, borderBottomColor: MAROON },
  headCrest: { width: 34, height: 42, marginRight: 10 },
  headSchool: { fontFamily: "Helvetica-Bold", fontSize: 15, letterSpacing: 0.4 },
  headMotto: { fontFamily: "Times-Italic", fontSize: 8.5, color: MUTED, marginTop: 1 },
  headRight: { marginLeft: "auto", alignItems: "flex-end" },
  headTitle: { fontFamily: "Helvetica-Bold", fontSize: 11, color: MAROON, letterSpacing: 1.5 },
  headMeta: { fontSize: 7.5, color: MUTED, marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  cut: { width: "49.2%", height: 134, marginBottom: 5, padding: 3.5, borderWidth: 0.8, borderStyle: "dashed", borderColor: LINE, borderRadius: 4 },
  card: { flex: 1, flexDirection: "row", borderRadius: 7, overflow: "hidden", borderWidth: 0.8, borderColor: "#e8e1d7" },
  band: { width: 58, backgroundColor: NAVY, alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  bandCrest: { width: 32, height: 39 },
  bandName: { fontFamily: "Helvetica-Bold", fontSize: 6.2, color: "#ffffff", textAlign: "center", marginTop: 5, letterSpacing: 0.6, lineHeight: 1.25 },
  bandGold: { width: 22, height: 2, backgroundColor: GOLD, marginTop: 5, borderRadius: 1 },
  body: { flex: 1, paddingHorizontal: 9, paddingTop: 6, paddingBottom: 5, backgroundColor: "#ffffff" },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kicker: { fontFamily: "Helvetica-Bold", fontSize: 6.5, color: MAROON, letterSpacing: 1.4 },
  serial: { fontFamily: "Helvetica-Bold", fontSize: 7, color: "#ffffff", backgroundColor: MAROON, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 7 },
  pinBox: { marginTop: 4, backgroundColor: CREAM, borderRadius: 5, borderWidth: 0.8, borderColor: "#eadfcf", paddingVertical: 5, alignItems: "center" },
  pin: { fontFamily: "Courier-Bold", fontSize: 19, letterSpacing: 2.5, color: NAVY },
  rules: { fontSize: 6.3, color: MUTED, textAlign: "center", marginTop: 3 },
  steps: { marginTop: 4 },
  step: { flexDirection: "row", marginBottom: 1.6 },
  stepNo: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: NAVY, color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 5.5, textAlign: "center", paddingTop: 1.6, marginRight: 4 },
  stepText: { flex: 1, fontSize: 6.6, lineHeight: 1.3 },
  bold: { fontFamily: "Helvetica-Bold" },
  cardFoot: { marginTop: "auto", flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.5, borderTopColor: "#eee6da", paddingTop: 3 },
  foot: { fontSize: 5.8, color: MUTED },
  pageFoot: { position: "absolute", bottom: 12, left: 26, right: 26, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: MUTED },
  regTitle: { fontFamily: "Helvetica-Bold", fontSize: 13, marginBottom: 3 },
  regIntro: { fontSize: 8, color: MUTED, marginBottom: 10 },
  th: { flexDirection: "row", backgroundColor: NAVY, color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 7.5 },
  tr: { flexDirection: "row", borderBottomWidth: 0.6, borderBottomColor: LINE, minHeight: 19, alignItems: "center" },
  cell: { paddingHorizontal: 5, paddingVertical: 4 },
});

const no = (i: number) => String(i + 1).padStart(3, "0");
const spaced = (pin: string) => `${pin.slice(0, 3)} ${pin.slice(3, 6)} ${pin.slice(6)}`;
const day = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" });
const chunk = <T,>(list: T[], size: number) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

function Header({ data, title }: { data: PinCardsData; title: string }) {
  const n = data.pins.length;
  return (
    <View style={s.header} fixed>
      <Image src={data.crest} style={s.headCrest} />
      <View>
        <Text style={s.headSchool}>{data.school.name.toUpperCase()}</Text>
        {data.school.motto ? <Text style={s.headMotto}>{data.school.motto}</Text> : null}
      </View>
      <View style={s.headRight}>
        <Text style={s.headTitle}>{title}</Text>
        <Text style={s.headMeta}>{data.label ? `${data.label} · ` : ""}Created {day(data.createdAt)}</Text>
        <Text style={s.headMeta}>{n} PIN{n === 1 ? "" : "s"} · Nos. {no(0)} to {no(n - 1)}</Text>
      </View>
    </View>
  );
}

function PageFoot({ text }: { text: string }) {
  return (
    <View style={s.pageFoot} fixed>
      <Text>{text}</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

function Card({ pin, index, data }: { pin: string; index: number; data: PinCardsData }) {
  const site = data.school.website.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <View style={s.cut} wrap={false}>
      <View style={s.card}>
        <View style={s.band}>
          <Image src={data.crest} style={s.bandCrest} />
          <Text style={s.bandName}>{data.school.name.toUpperCase()}</Text>
          <View style={s.bandGold} />
        </View>
        <View style={s.body}>
          <View style={s.topRow}>
            <Text style={s.kicker}>RESULT CHECKER PIN</Text>
            <Text style={s.serial}>No. {no(index)}</Text>
          </View>
          <View style={s.pinBox}>
            <Text style={s.pin}>{spaced(pin)}</Text>
          </View>
          <Text style={s.rules}>Opens a result {PIN_RULES.maxUses} times · valid {PIN_RULES.expiryDaysFromFirstUse} days from first use</Text>
          <View style={s.steps}>
            <View style={s.step}><Text style={s.stepNo}>1</Text><Text style={s.stepText}>Visit <Text style={s.bold}>{site}/results</Text></Text></View>
            <View style={s.step}><Text style={s.stepNo}>2</Text><Text style={s.stepText}>Enter the student&apos;s name and admission number</Text></View>
            <View style={s.step}><Text style={s.stepNo}>3</Text><Text style={s.stepText}>Type this PIN, then view, print or download the result</Text></View>
          </View>
          <View style={s.cardFoot}>
            <Text style={s.foot}>Keep this card private.</Text>
            {data.school.phone ? <Text style={s.foot}>Help: {data.school.phone}</Text> : null}
          </View>
        </View>
      </View>
    </View>
  );
}

export function PinCardsPdf(data: PinCardsData) {
  return (
    <Document title={`${data.school.name} result PINs`} author={data.school.name}>
      {chunk(data.pins, PER_PAGE).map((page, p) => (
        <Page key={p} size="A4" style={s.page}>
          <Header data={data} title="RESULT CHECKER PINS" />
          <View style={s.grid}>
            {page.map((pin, i) => <Card key={pin} pin={pin} index={p * PER_PAGE + i} data={data} />)}
          </View>
          <PageFoot text="Cut along the dashed lines. Each PIN works on its own: keep these pages somewhere safe." />
        </Page>
      ))}
      <Page size="A4" style={s.page}>
        <Header data={data} title="PIN REGISTER" />
        <Text style={s.regTitle}>Who received each PIN</Text>
        <Text style={s.regIntro}>For the school office: write who each card was given to. If a card is lost, its number tells the Admin which PIN to disable.</Text>
        <View style={s.th} fixed>
          <Text style={[s.cell, { width: 38 }]}>No.</Text>
          <Text style={[s.cell, { width: 92 }]}>PIN</Text>
          <Text style={[s.cell, { flex: 1 }]}>Given to (parent / student)</Text>
          <Text style={[s.cell, { width: 62 }]}>Class</Text>
          <Text style={[s.cell, { width: 62 }]}>Date</Text>
          <Text style={[s.cell, { width: 72 }]}>Signature</Text>
        </View>
        {data.pins.map((pin, i) => (
          <View key={pin} style={[s.tr, i % 2 ? { backgroundColor: CREAM } : {}]} wrap={false}>
            <Text style={[s.cell, s.bold, { width: 38, color: MAROON }]}>{no(i)}</Text>
            <Text style={[s.cell, { width: 92, fontFamily: "Courier-Bold", fontSize: 8.5 }]}>{spaced(pin)}</Text>
            <Text style={[s.cell, { flex: 1 }]} />
            <Text style={[s.cell, { width: 62 }]} />
            <Text style={[s.cell, { width: 62 }]} />
            <Text style={[s.cell, { width: 72 }]} />
          </View>
        ))}
        <PageFoot text="Confidential: this register lists working PINs. Store it with the cards." />
      </Page>
    </Document>
  );
}
