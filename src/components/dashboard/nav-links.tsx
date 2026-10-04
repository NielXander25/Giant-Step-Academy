"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen, CalendarDays, Check, ClipboardList, Globe, GraduationCap, Home, Inbox, KeyRound,
  Link2, Pencil, School, ScrollText, Settings, ShieldCheck, User, Users, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IconKey, NavItem } from "./nav-config";

const ICONS: Record<IconKey, LucideIcon> = {
  home: Home, users: Users, inbox: Inbox, link: Link2, calendar: CalendarDays, school: School,
  book: BookOpen, graduation: GraduationCap, settings: Settings, scroll: ScrollText,
  chart: ClipboardList, key: KeyRound, shield: ShieldCheck, globe: Globe, pencil: Pencil,
  check: Check, user: User,
};

export function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const groups = items.reduce<Record<string, NavItem[]>>((acc, item) => {
    const key = item.group ?? "";
    (acc[key] ??= []).push(item);
    return acc;
  }, {});

  return (
    <nav aria-label="Main" className="flex flex-col gap-6">
      {Object.entries(groups).map(([group, list]) => (
        <div key={group} className="flex flex-col gap-1">
          {group && <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-white/45">{group}</p>}
          {list.map((item) => {
            const Icon = ICONS[item.icon];
            const active = item.ready && (pathname === item.href || (item.href.split("/").length > 2 && pathname.startsWith(item.href + "/")));
            const base = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm";
            if (!item.ready) {
              return (
                <span key={item.href} className={cn(base, "cursor-not-allowed text-white/35")} title={`Coming in Phase ${item.phase}`}>
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  <span className="text-[10px] uppercase tracking-wide">Soon</span>
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(base, "text-white/80 hover:bg-white/10 hover:text-white", active && "bg-white/12 font-medium text-white shadow-[inset_3px_0_0_var(--accent)]")}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
