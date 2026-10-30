export const SITE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/academics", label: "Academics" },
  { href: "/admissions", label: "Admissions" },
  { href: "/school-life", label: "School life" },
  { href: "/news", label: "News" },
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/staff", label: "Staff" },
  { href: "/contact", label: "Contact" },
  { href: "/results", label: "Check results" },
] as const;

// The three sections of the school and the colours from the school's own banner.
export const SECTIONS = [
  { key: "nursery", name: "Nursery", color: "#ff9500", block: "academics.nursery.body" },
  { key: "primary", name: "Primary", color: "#34c759", block: "academics.primary.body" },
  { key: "secondary", name: "Secondary", color: "#af52de", block: "academics.secondary.body" },
] as const;
