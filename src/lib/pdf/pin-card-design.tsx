import { Circle, Defs, Document, Image, Page, RadialGradient, Rect, Stop, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { PIN_RULES } from "@/lib/constants";

// A result PIN card for parents, Apple-style: credit-card size (85.6 × 54 mm), white front with the PIN, school-blue
// back with how to check a result. Blue and white, with yellow as the partner colour.

const BLUE = "#0071e3";
const NAVY = "#0b1d3d";
const SUN = "#ffcc00";
const SKY = "#32ade6";
const GREY = "#6e6e73";
const W = 242.6; // 85.6 mm
const H = 153.1; // 54 mm

export type PinCardDesignData = { pin: string; number: number; website: string; phone: string | null; crest: Buffer; whiteCrest?: Buffer };

const s = StyleSheet.create({
  page: { width: W, height: H, position: "relative", fontFamily: "Helvetica" },
  glow: { position: "absolute", top: 0, left: 0, width: W, height: H },
  front: { position: "absolute", top: 0, left: 0, width: W, height: H },
  inner: { padding: 14 },
  row: { flexDirection: "row", alignItems: "center" },
  crest: { width: 17, height: 25.5, marginRight: 6 },
  school: { fontFamily: "Helvetica-Bold", fontSize: 9.5, color: NAVY, letterSpacing: -0.2 },
  pill: { marginLeft: "auto", backgroundColor: SUN, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2.5 },
  pillText: { fontFamily: "Helvetica-Bold", fontSize: 5.6, color: NAVY, letterSpacing: 0.8 },
  label: { marginTop: 17, fontSize: 6.5, color: GREY },
  pin: { marginTop: 2, fontFamily: "Helvetica-Bold", fontSize: 25, color: NAVY, letterSpacing: 1.6 },
  bar: { marginTop: 7, width: 22, height: 2.4, borderRadius: 1.2, backgroundColor: SUN },
  foot: { position: "absolute", left: 14, right: 14, bottom: 11, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  number: { fontFamily: "Helvetica-Bold", fontSize: 6.5, color: BLUE },
  rule: { fontSize: 5.6, color: GREY },
  back: { width: W, height: H, backgroundColor: BLUE, padding: 14, color: "#ffffff" },
  title: { fontFamily: "Helvetica-Bold", fontSize: 12, letterSpacing: -0.3 },
  steps: { marginTop: 9 },
  step: { flexDirection: "row", alignItems: "center", marginBottom: 5.5 },
  dot: { width: 11, height: 11, borderRadius: 5.5, backgroundColor: SUN, marginRight: 6, alignItems: "center", justifyContent: "center" },
  dotText: { fontFamily: "Helvetica-Bold", fontSize: 6, color: NAVY },
  stepText: { fontSize: 7, color: "#ffffff" },
  bold: { fontFamily: "Helvetica-Bold" },
  backFoot: { position: "absolute", left: 14, right: 14, bottom: 11, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  small: { fontSize: 5.6, color: "rgba(255,255,255,0.8)" },
  backCrest: { width: 13, height: 19.5 },
});

const spaced = (pin: string) => `${pin.slice(0, 3)} ${pin.slice(3, 6)} ${pin.slice(6)}`;

/** The white front: crest and name, a yellow "Result PIN" pill, the PIN large, its serial number and the rule. */
export function PinCardFront({ data }: { data: PinCardDesignData }) {
  return (
    <Page size={[W, H]} style={s.page}>
      <View style={s.front}>
        {/* Soft blue and yellow glows in the corners, like the website. */}
        <Svg style={s.glow} width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <Defs>
            <RadialGradient id="sky" cx="0.5" cy="0.5" r="0.5"><Stop offset="0" stopColor={SKY} stopOpacity={0.28} /><Stop offset="1" stopColor={SKY} stopOpacity={0} /></RadialGradient>
            <RadialGradient id="sun" cx="0.5" cy="0.5" r="0.5"><Stop offset="0" stopColor={SUN} stopOpacity={0.4} /><Stop offset="1" stopColor={SUN} stopOpacity={0} /></RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={W} height={H} fill="#ffffff" />
          <Circle cx={W - 10} cy={H + 10} r={95} fill="url(#sun)" />
          <Circle cx={-20} cy={-25} r={85} fill="url(#sky)" />
        </Svg>
        <View style={s.inner}>
        <View style={s.row}>
          <Image src={data.crest} style={s.crest} />
          <Text style={s.school}>Giant Step Academy</Text>
          <View style={s.pill}><Text style={s.pillText}>RESULT PIN</Text></View>
        </View>
        <Text style={s.label}>Your PIN</Text>
        <Text style={s.pin}>{spaced(data.pin)}</Text>
        <View style={s.bar} />
        </View>
      </View>
      <View style={s.foot}>
        <Text style={s.number}>No. {String(data.number).padStart(3, "0")}</Text>
        <Text style={s.rule}>Opens a result {PIN_RULES.maxUses} times · valid {PIN_RULES.expiryDaysFromFirstUse} days from first use</Text>
      </View>
    </Page>
  );
}

/** The blue back: how to check a result in three steps, the help line and a privacy note. */
export function PinCardBack({ data }: { data: PinCardDesignData }) {
  const site = data.website.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <Page size={[W, H]} style={s.page}>
      <View style={s.back}>
        <Text style={s.title}>Check your child&apos;s result</Text>
        <View style={s.steps}>
          <View style={s.step}><View style={s.dot}><Text style={s.dotText}>1</Text></View><Text style={s.stepText}>Visit <Text style={s.bold}>{site}/results</Text></Text></View>
          <View style={s.step}><View style={s.dot}><Text style={s.dotText}>2</Text></View><Text style={s.stepText}>Enter the student&apos;s name and admission number</Text></View>
          <View style={s.step}><View style={s.dot}><Text style={s.dotText}>3</Text></View><Text style={s.stepText}>Type the PIN on the front, then view or print</Text></View>
        </View>
        <View style={s.backFoot}>
          <View>
            {data.phone ? <Text style={s.small}>Need help? {data.phone}</Text> : null}
            <Text style={s.small}>Keep this card private.</Text>
          </View>
          {data.whiteCrest ? <Image src={data.whiteCrest} style={s.backCrest} /> : null}
        </View>
      </View>
    </Page>
  );
}

/** A two-page proof: the front, then the back. */
export function PinCardDesignPdf(data: PinCardDesignData) {
  return (
    <Document title="Giant Step Academy result PIN card">
      <PinCardFront data={data} />
      <PinCardBack data={data} />
    </Document>
  );
}
