import { optimizeImage } from "@/lib/cms/helpers";
import type { SchoolInfo } from "@/lib/cms/site-queries";

// The school's own crest artwork (public/images/logo): navy on white, and a white version for dark backgrounds.
const CREST = { src: "/images/logo/crest.png", ratio: 374 / 400 };
const CREST_WHITE = { src: "/images/logo/crest-white.png", ratio: 388 / 400 };

/** The school crest, exactly as the school's logo file. `onDark` uses the white version for the navy footer. */
export function CrestMark({ onDark = false, size = 44, title }: { onDark?: boolean; size?: number; title?: string }) {
  const c = onDark ? CREST_WHITE : CREST;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={c.src} alt={title ?? ""} aria-hidden={title ? undefined : true} width={Math.round(size * c.ratio)} height={size} className="shrink-0 select-none" draggable={false} />
  );
}

/** Crest + name in one lockup: the crest on the left, GIANT STEP / ACADEMY on the right. */
function Lockup({ onDark, height }: { onDark: boolean; height: number }) {
  return (
    <span className="inline-flex items-center gap-2.5" role="img" aria-label="Giant Step Academy">
      <CrestMark onDark={onDark} size={height} />
      <span aria-hidden="true" className={`flex flex-col font-black uppercase leading-[0.95] tracking-[0.04em] ${onDark ? "text-white" : "text-[#0a255a]"}`} style={{ fontSize: height * 0.4 }}>
        <span>Giant Step</span><span>Academy</span>
      </span>
    </span>
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
