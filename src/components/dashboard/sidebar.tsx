import { NAV } from "./nav-config";
import { NavLinks } from "./nav-links";
import type { Role } from "@prisma/client";

export function Sidebar({ role }: { role: Role }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-8 bg-navy px-4 py-6 md:flex">
      <div className="px-3 font-serif text-xl text-white">Giant Step Academy</div>
      <NavLinks items={NAV[role]} />
    </aside>
  );
}
