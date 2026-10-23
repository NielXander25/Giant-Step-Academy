export const SITE_LINKS = [
  { href: "/about", label: "About" },
  { href: "/academics", label: "Academics" },
  { href: "/admissions", label: "Admissions" },
  { href: "/school-life", label: "School life" },
  { href: "/news", label: "News" },
  { href: "/contact", label: "Contact" },
] as const;

// The three sections of the school and the colours from the school's own banner.
export const SECTIONS = [
  { key: "nursery", name: "Nursery", color: "#e07a2f", block: "academics.nursery.body" },
  { key: "primary", name: "Primary", color: "#2b3a82", block: "academics.primary.body" },
  { key: "secondary", name: "Secondary", color: "#8a5a36", block: "academics.secondary.body" },
] as const;
