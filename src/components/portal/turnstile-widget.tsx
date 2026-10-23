"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void }) => string };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** Cloudflare's "are you human" box. Renders nothing when no site key is configured. */
export function TurnstileWidget() {
  const box = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !box.current) return;
    const draw = () => {
      if (!window.turnstile || !box.current || box.current.childElementCount > 0) return;
      window.turnstile.render(box.current, {
        sitekey: SITE_KEY,
        callback: (t) => { if (field.current) field.current.value = t; },
        "expired-callback": () => { if (field.current) field.current.value = ""; },
      });
    };
    if (window.turnstile) return draw();
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = draw;
    document.head.appendChild(script);
  }, []);

  if (!SITE_KEY) return null;
  return (
    <div>
      <div ref={box} />
      <input ref={field} type="hidden" name="turnstileToken" />
    </div>
  );
}
