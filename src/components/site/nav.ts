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
  { key: "nursery", name: "Nursery", color: "#d9a520", block: "academics.nursery.body" },
  { key: "primary", name: "Primary", color: "#1d3866", block: "academics.primary.body" },
  { key: "secondary", name: "Secondary", color: "#800020", block: "academics.secondary.body" },
] as const;
