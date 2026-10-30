"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type RevealFrom = "fade" | "up" | "left" | "right" | "zoom";

// Where an element starts before it flies in. "fade" is the gentle default used for text.
const START: Record<RevealFrom, string> = {
  fade: "translate-y-4 opacity-0",
  up: "translate-y-14 opacity-0",
  left: "-translate-x-16 opacity-0",
  right: "translate-x-16 opacity-0",
  zoom: "scale-90 opacity-0",
};

/**
 * Brings content in as it scrolls into view: a gentle fade by default, or a fly-in from below, the left, the right,
 * or a zoom. Once per element, switched off for visitors who prefer reduced motion, and fully visible without JavaScript.
 */
export function Reveal({ children, delay = 0, className, as: Tag = "div", from = "fade" }: { children: React.ReactNode; delay?: number; className?: string; as?: "div" | "li" | "section"; from?: RevealFrom }) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"ssr" | "hidden" | "shown">("ssr");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return setState("shown");
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return setState("shown"); // already on screen: no flash
    setState("hidden");
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setState("shown"); io.disconnect(); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      style={state === "shown" && delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.2,0.75,0.2,1)]", from !== "fade" && "duration-[900ms]", state === "hidden" && START[from], className)}
    >
      {children}
    </Tag>
  );
}
