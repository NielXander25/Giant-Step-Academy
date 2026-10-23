import { parseRichText, type Inline } from "@/lib/cms/rich-text";
import { cn } from "@/lib/utils";

function Inlines({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.type === "bold" ? <strong key={i}>{p.text}</strong>
        : p.type === "italic" ? <em key={i}>{p.text}</em>
        : p.type === "link" ? (
          <a key={i} href={p.href} className="text-primary underline underline-offset-4 hover:text-navy" {...(p.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{p.text}</a>
        ) : <span key={i}>{p.text}</span>,
      )}
    </>
  );
}

/** Shows admin-written text. Built from safe pieces only: nothing typed here can inject HTML or scripts. */
export function RichText({ source, className }: { source: string | null | undefined; className?: string }) {
  const blocks = parseRichText(source);
  if (blocks.length === 0) return null;
  return (
    <div className={cn("space-y-4 leading-relaxed text-foreground/90", className)}>
      {blocks.map((b, i) =>
        b.type === "h2" ? <h2 key={i} className="mt-8 font-serif text-2xl text-navy first:mt-0"><Inlines parts={b.inline} /></h2>
        : b.type === "h3" ? <h3 key={i} className="mt-6 font-serif text-xl text-navy first:mt-0"><Inlines parts={b.inline} /></h3>
        : b.type === "ul" ? <ul key={i} className="list-disc space-y-1.5 pl-6 marker:text-accent">{b.items.map((it, j) => <li key={j}><Inlines parts={it} /></li>)}</ul>
        : <p key={i}><Inlines parts={b.inline} /></p>,
      )}
    </div>
  );
}
