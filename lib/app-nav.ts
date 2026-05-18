import type { LucideIcon } from "lucide-react";
import {
  Home,
  Lightbulb,
  FolderOpen,
  Users,
  Ticket,
  Vote,
  BookOpen,
  Archive,
  Shield,
} from "lucide-react";
import { BUDDIES_FEATURE_LABEL } from "@/lib/constants";

export type AppNavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  /** Match pathname prefix (default: exact or starts with href/) */
  matchPrefix?: boolean;
};

/** Shown to guests (signed out). */
export const PUBLIC_NAV: AppNavItem[] = [
  { href: "/hackathon", label: "Home", icon: Home },
  { href: "/hackathon/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/hackathon/resources", label: "Resources", icon: BookOpen },
  { href: "/past-projects", label: "Past", icon: Archive, matchPrefix: true },
];

/** Standard menu for signed-in participants (all main app screens). */
export const PARTICIPANT_NAV: AppNavItem[] = [
  { href: "/hackathon", label: "Home", icon: Home },
  { href: "/hackathon/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/hackathon/my-projects", label: "My project", icon: FolderOpen, matchPrefix: true },
  { href: "/hackathon/buddies", label: BUDDIES_FEATURE_LABEL, icon: Users },
  { href: "/checkin", label: "Check-in", icon: Ticket },
  { href: "/vote", label: "Vote", icon: Vote },
  { href: "/hackathon/resources", label: "Resources", icon: BookOpen },
  { href: "/past-projects", label: "Past", icon: Archive, matchPrefix: true },
];

/** Single top-level link for admins — full menu lives in /admin layout. */
export const ADMIN_NAV: AppNavItem[] = [
  { href: "/admin", label: "Admin", icon: Shield, matchPrefix: true },
];

export function isNavItemActive(pathname: string, item: AppNavItem): boolean {
  const href = item.href;
  if (href === "/hackathon") {
    return pathname === "/hackathon" || pathname === "/hackathon/";
  }
  if (href === "/admin") {
    return pathname === "/admin" || pathname === "/admin/" || pathname.startsWith("/admin/");
  }
  if (item.matchPrefix || href === "/past-projects" || href === "/hackathon/my-projects") {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function navItemsForUser(
  isAuthenticated: boolean,
  isAdmin: boolean,
  isOrganiser = false
): AppNavItem[] {
  if (!isAuthenticated) return PUBLIC_NAV;
  if (isAdmin) return [...PARTICIPANT_NAV, ...ADMIN_NAV];
  if (isOrganiser) return PARTICIPANT_NAV;
  return PARTICIPANT_NAV;
}
