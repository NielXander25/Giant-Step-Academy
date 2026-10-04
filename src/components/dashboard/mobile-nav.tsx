"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NavLinks } from "./nav-links";
import type { NavItem } from "./nav-config";

export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-primary-soft"
      >
        <Menu className="size-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex w-72 max-w-[85%] flex-col gap-6 overflow-y-auto bg-navy px-4 py-5">
            <div className="flex items-center justify-between px-3">
              <span className="font-serif text-xl text-white">Giant Step Academy</span>
              <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="text-white/80">
                <X className="size-5" />
              </button>
            </div>
            <NavLinks items={items} onNavigate={() => setOpen(false)} />
          </div>
          <button type="button" aria-label="Close menu" className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
