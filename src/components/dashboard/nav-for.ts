import type { Role } from "@prisma/client";
import { isDemoSite } from "@/lib/demo/mode";
import { NAV, type NavItem } from "./nav-config";

/** The menu for a role on this deployment: demo-only items appear on the demo site alone. */
export const navFor = (role: Role): NavItem[] => NAV[role].filter((item) => !item.demoOnly || isDemoSite());
