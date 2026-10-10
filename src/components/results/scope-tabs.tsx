import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = { basePath: string; sections: { id: string; name: string }[]; selected: string | null; overridden: Set<string> };

/** "All sections" plus one tab per section. A dot marks sections that have their own setup. */
export function ScopeTabs({ basePath, sections, selected, overridden }: Props) {
  const tab = (active: boolean) =>
    cn("rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-primary-soft", active && "border-primary bg-primary text-primary-foreground hover:bg-primary");
  return (
    <div className="mb-6 flex flex-wrap gap-2" role="navigation" aria-label="Apply to">
      <Link href={basePath} className={tab(selected === null)}>All sections</Link>
      {sections.map((s) => (
        <Link key={s.id} href={`${basePath}?section=${s.id}`} className={tab(selected === s.id)}>
          {s.name}{overridden.has(s.id) ? " •" : ""}
        </Link>
      ))}
    </div>
  );
}
