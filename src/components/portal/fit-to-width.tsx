"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Shows its content at a fixed design width and shrinks it to fit narrower screens, so a landscape report card
 * keeps its shape on a phone (parents can pinch to zoom). Printing ignores the scaling.
 */
export function FitToWidth({ width, children }: { width: number; children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ scale: number; height: number | null }>({ scale: 1, height: null });

  useLayoutEffect(() => {
    const measure = () => {
      if (!outer.current || !inner.current) return;
      const scale = Math.min(1, outer.current.clientWidth / width);
      setFit({ scale, height: inner.current.offsetHeight * scale });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (outer.current) ro.observe(outer.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={outer} className="w-full overflow-hidden print:!h-auto print:overflow-visible" style={{ height: fit.height ?? undefined }}>
      <div ref={inner} className="origin-top-left print:!w-auto print:!transform-none" style={{ width, transform: fit.scale < 1 ? `scale(${fit.scale})` : undefined }}>
        {children}
      </div>
    </div>
  );
}
