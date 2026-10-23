"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Gently fades content in as it scrolls into view. Subtle on purpose, once per element,
 * and switched off for visitors who prefer reduced motion. Content is fully visible without JavaScript.
 */
export function Reveal({ children, delay = 0, className, as: Tag = "div" }: { children: React.ReactNode; delay?: number; className?: string; as?: "div" | "li" | "section" }) {
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
      className={cn("transition-[opacity,transform] duration-700 ease-out", state === "hidden" && "translate-y-4 opacity-0", className)}
    >
      {children}
    </Tag>
  );
}
