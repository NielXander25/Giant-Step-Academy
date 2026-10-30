"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { RESULTS_LINK, SITE_LINKS } from "./nav";

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const active = (href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
        {SITE_LINKS.map((l) => (
          <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined}
            className={cn("whitespace-nowrap rounded-full px-3.5 py-1.5 text-[15px] font-medium text-foreground/75 hover:text-foreground", active(l.href) && "bg-muted text-foreground")}>
            {l.label}
          </Link>
        ))}
        <Link href={RESULTS_LINK.href} className="ml-2 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#0062c4]">{RESULTS_LINK.label}</Link>
      </nav>

      <button type="button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}
        className="inline-flex size-11 items-center justify-center rounded-full text-navy hover:bg-muted lg:hidden">
        <Menu className="size-7" />
      </button>

      {/* Rendered into <body>: the header's backdrop blur would otherwise trap this fixed panel inside the header bar. */}
      {open && createPortal(
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          <button type="button" aria-label="Close menu" className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
          <div className="flex w-80 max-w-[88%] flex-col overflow-y-auto bg-white p-6">
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="mb-6 self-end rounded-full p-2 hover:bg-muted"><X className="size-6" /></button>
            <div className="flex flex-col items-center gap-2">
              {SITE_LINKS.map((l) => (
                <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined}
                  className={cn("w-full rounded-2xl px-4 py-3.5 text-center text-xl font-semibold text-navy hover:bg-muted", active(l.href) && "bg-muted")}>
                  {l.label}
                </Link>
              ))}
              <Link href={RESULTS_LINK.href} className="mt-4 w-full rounded-full bg-primary px-4 py-3.5 text-center text-lg font-semibold text-white">{RESULTS_LINK.label}</Link>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
