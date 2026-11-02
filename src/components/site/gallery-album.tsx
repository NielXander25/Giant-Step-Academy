"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Reveal, flyFor } from "@/components/site/reveal";
import type { GalleryPhoto } from "@/lib/cms/school-photos";
import { cn } from "@/lib/utils";

/**
 * One album: a bento grid (the first photo large, the rest beside and below it), captions on the photos, and a
 * full-screen viewer with previous / next (arrow keys and Escape work too).
 */
export function GalleryAlbum({ photos, color }: { photos: GalleryPhoto[]; color: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, close, step]);

  // Layout by count, so the grid always closes neatly: 1 photo full width; 2 side by side; 3 or more a large
  // feature tile (two columns, two rows) with the others filling the space beside it.
  const n = photos.length;
  const tile = (i: number) => {
    if (n === 1) return "sm:col-span-2 lg:col-span-2 lg:col-start-2 aspect-[4/5]";
    if (n === 2) return "lg:col-span-2 aspect-[4/3]";
    const base = "aspect-[4/3] lg:aspect-auto";
    if (i === 0) return `${base} sm:col-span-2 lg:row-span-2`;
    if (n === 3) return `${base} lg:col-span-2`;
    if (n === 4 && i === 3) return `${base} lg:col-span-2`;
    return base;
  };

  const current = open === null ? null : photos[open];

  return (
    <>
      <ul className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", n >= 3 && "lg:auto-rows-[16rem]")}>
        {photos.map((ph, i) => (
          <Reveal as="li" key={ph.src} {...flyFor(i)} className={cn("group relative overflow-hidden rounded-3xl bg-muted shadow-[0_1px_2px_rgba(0,0,0,0.04)]", tile(i))}>
            <button type="button" onClick={() => setOpen(i)} className="absolute inset-0 block size-full text-left" aria-label={`View larger: ${ph.caption}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ph.src} alt={ph.alt} width={ph.width} height={ph.height} loading="lazy" decoding="async"
                className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent px-5 pb-4 pt-14">
                <span aria-hidden="true" className="mb-2 block h-1 w-8 rounded-full" style={{ background: color }} />
                <span className="block text-[15px] font-semibold leading-snug text-white">{ph.caption}</span>
              </span>
            </button>
          </Reveal>
        ))}
      </ul>

      {current && open !== null && (
        <div role="dialog" aria-modal="true" aria-label={current.caption} className="fixed inset-0 z-[80] flex flex-col bg-black/90 backdrop-blur-sm" onClick={close}>
          <div className="flex items-center justify-between px-4 py-3 text-white sm:px-6">
            <span className="text-sm text-white/70">{open + 1} / {photos.length}</span>
            <button type="button" onClick={close} aria-label="Close" className="rounded-full p-2 hover:bg-white/10"><X className="size-6" aria-hidden /></button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4 pb-4 sm:px-16" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.src} alt={current.alt} className="max-h-[78vh] max-w-full rounded-2xl object-contain shadow-2xl" />
            {photos.length > 1 && (
              <>
                <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white hover:bg-white/25 sm:left-4"><ChevronLeft className="size-6" aria-hidden /></button>
                <button type="button" onClick={() => step(1)} aria-label="Next photo" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white hover:bg-white/25 sm:right-4"><ChevronRight className="size-6" aria-hidden /></button>
              </>
            )}
          </div>
          <p className="px-6 pb-8 text-center text-lg font-medium text-white" onClick={(e) => e.stopPropagation()}>{current.caption}</p>
        </div>
      )}
    </>
  );
}
