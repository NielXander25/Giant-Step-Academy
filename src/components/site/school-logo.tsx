import { useId } from "react";
import { optimizeImage } from "@/lib/cms/helpers";
import type { SchoolInfo } from "@/lib/cms/site-queries";

const INK = "#00245a"; // the school's navy, from the official logo

// Five-pointed star centred on (cx, cy)
const star = (cx: number, cy: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.42;
    return `${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`;
  }).join(" ");

// The rising sun: a half disc with a saw-tooth edge, sitting on y = 77
const SUN = (() => {
  const teeth = 30;
  const pts = Array.from({ length: teeth * 2 + 1 }, (_, i) => {
    const a = Math.PI + (Math.PI * i) / (teeth * 2);
    const out = i % 2 === 1;
    const rx = out ? 28 : 25.6;
    const ry = out ? 22 : 19.6;
    return `${(60 + rx * Math.cos(a)).toFixed(2)},${(77 + ry * Math.sin(a)).toFixed(2)}`;
  });
  return pts.join(" ");
})();

const SHIELD = "M10 4H110V50C110 72 90 87 60 96C30 87 10 72 10 50Z";
const MOTTO_PATH = "M0 90Q60 152 120 90";
const FONT = "var(--font-body), Inter, Arial, sans-serif";

/** The crest artwork in a 120 × 126 box: shield with the name panel, five stars, rising sun, open book, and the motto curving beneath. */
function CrestArt({ ink, paper, id }: { ink: string; paper: string; id: string }) {
  return (
    <>
      <path d={SHIELD} fill={paper} stroke={ink} strokeWidth="3.4" strokeLinejoin="round" />
      <path d="M10 34H110" stroke={ink} strokeWidth="3.4" />
      <g fill={ink} fontFamily={FONT} fontWeight="800" textAnchor="middle">
        <text x="60" y="18.6" fontSize="12.4" textLength="86" lengthAdjust="spacingAndGlyphs">GIANT STEP</text>
        <text x="60" y="30.4" fontSize="12.4" textLength="80" lengthAdjust="spacingAndGlyphs">ACADEMY</text>
      </g>
      <g fill={ink}>
        <polygon points={star(60, 44.5, 7.2)} />
        <polygon points={star(37, 49.5, 6)} />
        <polygon points={star(83, 49.5, 6)} />
        <polygon points={star(23.5, 60.5, 6)} />
        <polygon points={star(96.5, 60.5, 6)} />
        <polygon points={SUN} />
        <path d="M59 81.5C51 76.5 41 76 32.5 80L35 87.5C43.5 85 52 86 59 90.5Z" />
        <path d="M61 81.5C69 76.5 79 76 87.5 80L85 87.5C76.5 85 68 86 61 90.5Z" />
      </g>
      <path id={id} d={MOTTO_PATH} fill="none" />
      <text fill={ink} fontFamily={FONT} fontWeight="800" fontSize="8.7" letterSpacing="0.2">
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">SECURING A BRIGHT FUTURE</textPath>
      </text>
    </>
  );
}

/**
 * The school crest drawn as a clean vector (so it stays sharp at any size), matching the official logo.
 * Navy on white by default; `onDark` gives the white-line version for the navy footer.
 */
export function CrestMark({ onDark = false, size = 44, title }: { onDark?: boolean; size?: number; title?: string }) {
  const id = `gsa-motto-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 120 126" width={(size * 120) / 126} height={size} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} className="shrink-0">
      <CrestArt ink={onDark ? "#ffffff" : INK} paper={onDark ? "none" : "#ffffff"} id={id} />
    </svg>
  );
}

/** Crest + name in one lockup: the crest on the left, GIANT STEP / ACADEMY on the right. */
function Lockup({ onDark, height }: { onDark: boolean; height: number }) {
  const ink = onDark ? "#ffffff" : INK;
  const id = `gsa-motto-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 640 150" height={height} width={(height * 640) / 150} role="img" aria-label="Giant Step Academy" className="shrink-0">
      <svg x="0" y="0" width="143" height="150" viewBox="0 0 120 126" aria-hidden="true">
        <CrestArt ink={ink} paper={onDark ? "none" : "#ffffff"} id={id} />
      </svg>
      <g fill={ink} fontFamily={FONT} fontWeight="900" aria-hidden="true">
        <text x="160" y="70" fontSize="70" textLength="452" lengthAdjust="spacing">GIANT STEP</text>
        <text x="160" y="136" fontSize="70" textLength="452" lengthAdjust="spacing">ACADEMY</text>
      </g>
    </svg>
  );
}

const isBrandName = (name: string) => name.trim().toLowerCase() === "giant step academy";

/**
 * The school's logo. If an Admin has uploaded an official logo it is used everywhere; otherwise the crest lockup is drawn.
 * `compact` shows just the crest (for small spaces).
 */
export function SchoolLogo({ school, height = 44, onDark = false, compact = false }: { school: Pick<SchoolInfo, "name" | "logoUrl">; height?: number; onDark?: boolean; compact?: boolean }) {
  const uploaded = optimizeImage(school.logoUrl, height * 4);
  if (uploaded) {
    // On the navy footer an uploaded logo sits on a white card so it stays readable.
    // eslint-disable-next-line @next/next/no-img-element
    const img = <img src={uploaded} alt={school.name} height={height} style={{ height, width: "auto", maxWidth: height * 5 }} className="shrink-0 object-contain" />;
    return onDark ? <span className="inline-flex rounded-xl bg-white p-2.5">{img}</span> : img;
  }
  if (compact || !isBrandName(school.name)) {
    return (
      <span className="inline-flex items-center gap-3">
        <span className={onDark ? "inline-flex rounded-xl bg-white p-1.5" : "inline-flex"}><CrestMark size={height} title={compact ? school.name : undefined} /></span>
        {!compact && <span className={`font-serif text-xl leading-tight ${onDark ? "text-white" : "text-navy"}`}>{school.name}</span>}
      </span>
    );
  }
  // The logo always sits on white: on the navy footer it goes on a white card.
  return onDark ? <span className="inline-flex rounded-2xl bg-white px-4 py-3"><Lockup onDark={false} height={height} /></span> : <Lockup onDark={false} height={height} />;
}
