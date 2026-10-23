import { optimizeImage } from "@/lib/cms/helpers";
import type { SchoolInfo } from "@/lib/cms/site-queries";

const INK = "#2d3780"; // the school's navy, as photographed on its banner

// Five-pointed star centred on (cx, cy)
const star = (cx: number, cy: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.42;
    return `${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`;
  }).join(" ");

/**
 * The school crest drawn as a clean vector (so it stays sharp at any size): shield, name label, five stars,
 * rising sun, path and the motto. `onDark` swaps navy and white for use on the navy footer.
 */
export function CrestMark({ onDark = false, size = 44, title }: { onDark?: boolean; size?: number; title?: string }) {
  const ink = onDark ? "#ffffff" : INK;
  const paper = onDark ? "var(--navy)" : "#ffffff";
  return (
    <svg viewBox="0 0 100 150" width={(size * 100) / 150} height={size} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} className="shrink-0">
      <path d="M3 3H97V93C97 124 75 143 50 149C25 143 3 124 3 93Z" fill={ink} />
      <rect x="9" y="9" width="82" height="31" fill={paper} />
      <g fill={ink} fontFamily="var(--font-body), Arial, sans-serif" fontWeight="800" textAnchor="middle">
        <text x="50" y="23" fontSize="12.5" textLength="72" lengthAdjust="spacing">GIANT STEP</text>
        <text x="50" y="36" fontSize="12.5" textLength="72" lengthAdjust="spacing">ACADEMY</text>
      </g>
      <g fill={paper}>
        <polygon points={star(28.5, 53, 4.6)} />
        <polygon points={star(48.5, 50.5, 5.8)} />
        <polygon points={star(75, 61, 5.8)} />
        <polygon points={star(19.5, 67.5, 4.2)} />
        <polygon points={star(81.5, 78, 4.6)} />
        <path d="M21 90A30 27 0 0 1 82 90Z" />
        <path d="M20 112C30 110 41 105 49 101L49 112Z" />
        <path d="M52.5 101C62 106 75 110.5 87 113L52.5 112Z" />
      </g>
      <path id="gsa-motto" d="M19.5 117C24 134 38 142 51 142C65 142 77 133 82 118" fill="none" />
      <text fill={paper} fontFamily="var(--font-body), Arial, sans-serif" fontWeight="800" fontSize="6.4">
        <textPath href="#gsa-motto" startOffset="50%" textAnchor="middle" textLength="60" lengthAdjust="spacing">SECURING A BRIGHT FUTURE</textPath>
      </text>
    </svg>
  );
}

/** Crest + name in one lockup, like the school's own banner: shield on the left, GIANT STEP / ACADEMY on the right. */
function Lockup({ onDark, height }: { onDark: boolean; height: number }) {
  const ink = onDark ? "#ffffff" : INK;
  return (
    <svg viewBox="0 0 610 150" height={height} width={(height * 610) / 150} role="img" aria-label="Giant Step Academy" className="shrink-0">
      <g transform="translate(0 0)">
        <foreignObject width="0" height="0" />
      </g>
      <g aria-hidden="true">
        <svg x="0" y="0" width="100" height="150" viewBox="0 0 100 150">
          <path d="M3 3H97V93C97 124 75 143 50 149C25 143 3 124 3 93Z" fill={ink} />
          <rect x="9" y="9" width="82" height="31" fill={onDark ? "var(--navy)" : "#fff"} />
          <g fill={ink} fontFamily="var(--font-body), Arial, sans-serif" fontWeight="800" textAnchor="middle">
            <text x="50" y="23" fontSize="12.5" textLength="72" lengthAdjust="spacing">GIANT STEP</text>
            <text x="50" y="36" fontSize="12.5" textLength="72" lengthAdjust="spacing">ACADEMY</text>
          </g>
          <g fill={onDark ? "var(--navy)" : "#fff"}>
            <polygon points={star(28.5, 53, 4.6)} /><polygon points={star(48.5, 50.5, 5.8)} /><polygon points={star(75, 61, 5.8)} />
            <polygon points={star(19.5, 67.5, 4.2)} /><polygon points={star(81.5, 78, 4.6)} />
            <path d="M21 90A30 27 0 0 1 82 90Z" /><path d="M20 112C30 110 41 105 49 101L49 112Z" /><path d="M52.5 101C62 106 75 110.5 87 113L52.5 112Z" />
          </g>
          <path id="gsa-motto-l" d="M19.5 117C24 134 38 142 51 142C65 142 77 133 82 118" fill="none" />
          <text fill={onDark ? "var(--navy)" : "#fff"} fontFamily="var(--font-body), Arial, sans-serif" fontWeight="800" fontSize="6.4">
            <textPath href="#gsa-motto-l" startOffset="50%" textAnchor="middle" textLength="60" lengthAdjust="spacing">SECURING A BRIGHT FUTURE</textPath>
          </text>
        </svg>
        <g fill={ink} fontFamily="var(--font-body), 'Arial Black', Arial, sans-serif" fontWeight="900">
          <text x="124" y="64" fontSize="73" textLength="478" lengthAdjust="spacing">GIANT STEP</text>
          <text x="124" y="132" fontSize="73" textLength="478" lengthAdjust="spacing">ACADEMY</text>
        </g>
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
        <CrestMark onDark={onDark} size={height} title={compact ? school.name : undefined} />
        {!compact && <span className={`font-serif text-xl leading-tight ${onDark ? "text-white" : "text-navy"}`}>{school.name}</span>}
      </span>
    );
  }
  return <Lockup onDark={onDark} height={height} />;
}
