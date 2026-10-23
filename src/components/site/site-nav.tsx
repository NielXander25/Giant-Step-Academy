"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_LINKS } from "./nav";

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
        {SITE_LINKS.map((l) => (
          <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined}
            className={cn("rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-primary-soft hover:text-navy", active(l.href) && "bg-primary-soft text-navy")}>
            {l.label}
          </Link>
        ))}
      </nav>

      <button type="button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}
        className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-primary-soft lg:hidden">
        <Menu className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          <button type="button" aria-label="Close menu" className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
          <div className="flex w-72 max-w-[85%] flex-col gap-1 overflow-y-auto bg-white p-5">
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="mb-2 self-end rounded-lg p-2 hover:bg-primary-soft"><X className="size-5" /></button>
            {SITE_LINKS.map((l) => (
              <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined}
                className={cn("rounded-lg px-3 py-3 text-base font-medium hover:bg-primary-soft", active(l.href) && "bg-primary-soft text-navy")}>
                {l.label}
              </Link>
            ))}
            <Link href="/results" className="mt-3 rounded-lg bg-primary px-3 py-3 text-center font-medium text-primary-foreground">Check results</Link>
          </div>
        </div>
      )}
    </>
  );
}
