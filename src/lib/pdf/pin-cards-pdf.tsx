import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// The printed list of a new PIN batch: numbered PINs with an empty box beside each, to tick off as they are given out.
// Made only at the moment PINs are created, the one time they exist in plain form.

const NAVY = "#142a4c";
const LINE = "#9aa3b2";
const MUTED = "#586273";

const PER_COLUMN = 25;
const PER_PAGE = PER_COLUMN * 2;

export type PinCardsData = {
  pins: string[];
  label: string | null;
  createdAt: Date;
  school: { name: string; motto: string | null; phone: string | null; website: string };
  crest: Buffer;
};

const s = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 34, paddingHorizontal: 34, fontFamily: "Helvetica", fontSize: 10, color: NAVY },
  header: { flexDirection: "row", alignItems: "center", paddingBottom: 8, marginBottom: 12, borderBottomWidth: 1.2, borderBottomColor: NAVY },
  crest: { width: 26, height: 32, marginRight: 9 },
  school: { fontFamily: "Helvetica-Bold", fontSize: 13 },
  meta: { fontSize: 8.5, color: MUTED, marginTop: 2 },
  left: { flex: 1, paddingRight: 12 },
  right: { width: 230, alignItems: "flex-end" },
  title: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  columns: { flexDirection: "row", justifyContent: "space-between" },
  column: { width: "47%" },
  th: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: NAVY, paddingBottom: 3, marginBottom: 2, fontFamily: "Helvetica-Bold", fontSize: 8.5 },
  row: { flexDirection: "row", alignItems: "center", height: 25, borderBottomWidth: 0.5, borderBottomColor: "#d9dee6" },
  no: { width: 38, fontFamily: "Helvetica-Bold" },
  pin: { flex: 1, fontFamily: "Courier-Bold", fontSize: 12, letterSpacing: 1 },
  tickHead: { width: 34, textAlign: "center" },
  tickCell: { width: 34, alignItems: "center" },
  box: { width: 14, height: 14, borderWidth: 1, borderColor: LINE, borderRadius: 2 },
  foot: { position: "absolute", bottom: 14, left: 34, right: 34, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: MUTED },
});

const no = (i: number) => String(i + 1).padStart(3, "0");
const spaced = (pin: string) => `${pin.slice(0, 3)} ${pin.slice(3, 6)} ${pin.slice(6)}`;
const day = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" });
const chunk = <T,>(list: T[], size: number) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

function Column({ pins, start }: { pins: string[]; start: number }) {
  if (pins.length === 0) return <View style={s.column} />;
  return (
    <View style={s.column}>
      <View style={s.th}>
        <Text style={s.no}>No.</Text>
        <Text style={{ flex: 1 }}>PIN</Text>
        <Text style={s.tickHead}>Given</Text>
      </View>
      {pins.map((pin, i) => (
        <View key={pin} style={s.row}>
          <Text style={s.no}>{no(start + i)}</Text>
          <Text style={s.pin}>{spaced(pin)}</Text>
          <View style={s.tickCell}><View style={s.box} /></View>
        </View>
      ))}
    </View>
  );
}

export function PinCardsPdf(data: PinCardsData) {
  const n = data.pins.length;
  return (
    <Document title={`${data.school.name} result PINs`} author={data.school.name}>
      {chunk(data.pins, PER_PAGE).map((page, p) => (
        <Page key={p} size="A4" style={s.page}>
          <View style={s.header}>
            <Image src={data.crest} style={s.crest} />
            <View style={s.left}>
              <Text style={s.school}>{data.school.name}</Text>
              <Text style={s.meta}>Parents check results at {data.school.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}/results</Text>
            </View>
            <View style={s.right}>
              <Text style={s.title}>Result PINs</Text>
              {data.label ? <Text style={s.meta}>Batch: {data.label}</Text> : null}
              <Text style={s.meta}>{day(data.createdAt)} · {n} PIN{n === 1 ? "" : "s"}, Nos. {no(0)} to {no(n - 1)}</Text>
              <Text style={s.meta}>Each PIN works for any student in any class</Text>
            </View>
          </View>
          <View style={s.columns}>
            <Column pins={page.slice(0, PER_COLUMN)} start={p * PER_PAGE} />
            <Column pins={page.slice(PER_COLUMN)} start={p * PER_PAGE + PER_COLUMN} />
          </View>
          <View style={s.foot} fixed>
            <Text>Tick each PIN as it is given out. Keep this list private.</Text>
            <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          </View>
        </Page>
      ))}
    </Document>
  );
}
