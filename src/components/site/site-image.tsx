import { optimizeImage } from "@/lib/cms/helpers";
import { cn } from "@/lib/utils";
import { StepsMotif } from "./steps-motif";

/** A tasteful stand-in used wherever the school has not added a picture yet. */
export function ImagePlaceholder({ className, label }: { className?: string; label?: string }) {
  return (
    <div role="img" aria-label={label ?? "Picture coming soon"} className={cn("relative flex items-end justify-end overflow-hidden bg-gradient-to-br from-primary-soft via-white to-accent-soft p-6", className)}>
      <StepsMotif tone="dark" className="w-1/2 max-w-48 opacity-70" />
    </div>
  );
}

/** A picture from the content manager, sized for the page. Falls back to the placeholder when there is none. */
export function SiteImage({ src, alt, width = 900, className, priority = false }: { src: string | null | undefined; alt: string; width?: number; className?: string; priority?: boolean }) {
  const url = optimizeImage(src, width);
  if (!url) return <ImagePlaceholder className={className} label={alt || undefined} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} width={width} loading={priority ? "eager" : "lazy"} decoding="async" className={cn("object-cover", className)} />;
}
