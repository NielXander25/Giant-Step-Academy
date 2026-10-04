import type { Role } from "@prisma/client";

export type IconKey =
  | "home" | "users" | "inbox" | "link" | "calendar" | "school" | "book" | "graduation"
  | "settings" | "scroll" | "chart" | "key" | "shield" | "globe" | "pencil" | "check" | "user";

export type NavItem = {
  label: string;
  href: string;
  icon: IconKey;
  /** false = page not built yet; shown greyed out with the phase it arrives in. */
  ready: boolean;
  phase?: number;
  group?: string;
};

// When a later phase builds a page, flip `ready` to true for that item.
export const NAV: Record<Role, NavItem[]> = {
  SUPER_ADMIN: [
    { label: "Overview", href: "/super-admin", icon: "home", ready: true, group: "System" },
    { label: "Admins", href: "/super-admin/admins", icon: "shield", ready: true, group: "System" },
    { label: "Audit logs", href: "/super-admin/audit-logs", icon: "scroll", ready: false, phase: 10, group: "System" },
    { label: "Admin console", href: "/admin", icon: "settings", ready: true, group: "Switch to" },
    { label: "Change password", href: "/account/password", icon: "key", ready: true, group: "Account" },
  ],
  ADMIN: [
    { label: "Overview", href: "/admin", icon: "home", ready: true, group: "Overview" },
    { label: "Teacher requests", href: "/admin/teacher-requests", icon: "inbox", ready: true, group: "People" },
    { label: "Teachers", href: "/admin/teachers", icon: "users", ready: true, group: "People" },
    { label: "Assignments", href: "/admin/assignments", icon: "link", ready: true, group: "People" },
    { label: "Students", href: "/admin/students", icon: "graduation", ready: false, phase: 4, group: "People" },
    { label: "Sessions & terms", href: "/admin/sessions", icon: "calendar", ready: true, group: "Academics" },
    { label: "Classes", href: "/admin/classes", icon: "school", ready: true, group: "Academics" },
    { label: "Subjects", href: "/admin/subjects", icon: "book", ready: true, group: "Academics" },
    { label: "Grading", href: "/admin/settings/grading", icon: "settings", ready: false, phase: 5, group: "Results" },
    { label: "Results", href: "/admin/results", icon: "chart", ready: false, phase: 6, group: "Results" },
    { label: "PINs", href: "/admin/pins", icon: "key", ready: false, phase: 7, group: "Results" },
    { label: "Access logs", href: "/admin/access-logs", icon: "scroll", ready: false, phase: 7, group: "Results" },
    { label: "Website content", href: "/admin/cms", icon: "globe", ready: false, phase: 9, group: "Website" },
    { label: "Change password", href: "/account/password", icon: "key", ready: true, group: "Account" },
  ],
  TEACHER: [
    { label: "Overview", href: "/teacher", icon: "home", ready: true, group: "Overview" },
    { label: "My students", href: "/teacher/students", icon: "graduation", ready: false, phase: 4, group: "My class" },
    { label: "Result entry", href: "/teacher/results", icon: "pencil", ready: false, phase: 6, group: "My class" },
    { label: "Reviews", href: "/teacher/reviews", icon: "check", ready: false, phase: 6, group: "My class" },
    { label: "My profile", href: "/teacher/onboarding", icon: "user", ready: true, group: "Account" },
    { label: "Change password", href: "/account/password", icon: "key", ready: true, group: "Account" },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  TEACHER: "Teacher",
};
