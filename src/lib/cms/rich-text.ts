// A small, SAFE text format for page content and news articles. Admins type plain text with a few symbols:
//   ## Heading        ### Smaller heading        - bullet point        **bold**   *italic*   [link text](https://example.com)
// Nothing is ever inserted as raw HTML, so pasted content cannot run scripts or break the page.

export type Inline = { type: "text"; text: string } | { type: "bold"; text: string } | { type: "italic"; text: string } | { type: "link"; text: string; href: string };
export type Block =
  | { type: "h2" | "h3" | "p"; inline: Inline[] }
  | { type: "ul"; items: Inline[][] };

/** Only web, email, phone and same-site links are allowed. */
export function safeHref(raw: string): string | null {
  const href = raw.trim();
  if (/^https:\/\/[^\s]+$/i.test(href)) return href;
  if (/^mailto:[^\s]+$/i.test(href) || /^tel:[+\d\s()-]+$/i.test(href)) return href;
  if (/^\/[A-Za-z0-9/_?=&#%.-]*$/.test(href) && !href.startsWith("//")) return href;
  return null;
}

const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)\s]+\))/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  for (const part of text.split(INLINE)) {
    if (!part) continue;
    let m: RegExpExecArray | null;
    if ((m = /^\*\*([^*]+)\*\*$/.exec(part))) out.push({ type: "bold", text: m[1] });
    else if ((m = /^\*([^*\s][^*]*)\*$/.exec(part))) out.push({ type: "italic", text: m[1] });
    else if ((m = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part))) {
      const href = safeHref(m[2]);
      out.push(href ? { type: "link", text: m[1], href } : { type: "text", text: m[1] }); // an unsafe link shows as plain text
    } else out.push({ type: "text", text: part });
  }
  return out;
}

export function parseRichText(source: string | null | undefined): Block[] {
  const blocks: Block[] = [];
  const lines = (source ?? "").replace(/\r\n?/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: Inline[][] | null = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "p", inline: parseInline(paragraph.join(" ")) });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push({ type: "ul", items: list });
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushParagraph(); flushList(); continue; }
    let m: RegExpExecArray | null;
    if ((m = /^##\s+(.+)$/.exec(line))) { flushParagraph(); flushList(); blocks.push({ type: "h2", inline: parseInline(m[1]) }); }
    else if ((m = /^###\s+(.+)$/.exec(line))) { flushParagraph(); flushList(); blocks.push({ type: "h3", inline: parseInline(m[1]) }); }
    else if ((m = /^[-*]\s+(.+)$/.exec(line))) { flushParagraph(); (list ??= []).push(parseInline(m[1])); }
    else { flushList(); paragraph.push(line); }
  }
  flushParagraph();
  flushList();
  return blocks;
}

/** Plain text of some content, for search snippets and meta descriptions. */
export function plainText(source: string | null | undefined, max = 160): string {
  const text = (source ?? "").replace(/[#*_\[\]()`>-]/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}
