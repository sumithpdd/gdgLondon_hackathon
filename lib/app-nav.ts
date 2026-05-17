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
  LayoutDashboard,
  Calendar,
  FileText,
  MonitorPlay,
  Tags,
  Database,
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

/** Check-in desk — admin and moderator. */
export const ORGANISER_NAV: AppNavItem[] = [
  { href: "/admin/checkin", label: "Check-in desk", icon: Ticket },
];

/** Extra items for admins only (appended after participant links). */
export const ADMIN_NAV: AppNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/tags", label: "Tags", icon: Tags },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/voting", label: "Voting", icon: Vote },
  { href: "/admin/live", label: "Live", icon: MonitorPlay },
  { href: "/admin/hackathons", label: "Hackathons", icon: Calendar },
  { href: "/admin/seed-tags", label: "Seed tags", icon: Database },
];

export function isNavItemActive(pathname: string, item: AppNavItem): boolean {
  const href = item.href;
  if (href === "/hackathon") {
    return pathname === "/hackathon" || pathname === "/hackathon/";
  }
  if (href === "/admin") {
    return pathname === "/admin" || pathname === "/admin/";
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
  if (isAdmin) return [...PARTICIPANT_NAV, ...ORGANISER_NAV, ...ADMIN_NAV];
  if (isOrganiser) return [...PARTICIPANT_NAV, ...ORGANISER_NAV];
  return PARTICIPANT_NAV;
}
