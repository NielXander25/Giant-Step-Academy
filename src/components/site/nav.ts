// The public menu, kept short: five pages, plus Check results as its own button.
export const SITE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/admissions", label: "Admissions" },
  { href: "/events", label: "Gallery and Events" },
  { href: "/news", label: "Newsletter" },
] as const;

export const RESULTS_LINK = { href: "/results", label: "Check results" } as const;

// The three sections of the school and the colours from the school's own banner.
export const SECTIONS = [
  { key: "nursery", name: "Nursery", color: "#ff9500", block: "academics.nursery.body" },
  { key: "primary", name: "Primary", color: "#34c759", block: "academics.primary.body" },
  { key: "secondary", name: "Secondary", color: "#af52de", block: "academics.secondary.body" },
] as const;
