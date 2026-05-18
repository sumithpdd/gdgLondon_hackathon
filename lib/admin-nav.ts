import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Bug,
  Tags,
  FileText,
  Vote,
  MonitorPlay,
  Calendar,
  Database,
  Ticket,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  /** Match pathname prefix (e.g. /checkin) */
  matchPrefix?: boolean;
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        description: "Submissions and winner places",
      },
    ],
  },
  {
    id: "people",
    label: "People",
    items: [
      {
        href: "/admin/users",
        label: "Users",
        icon: Users,
        description: "Roles, profiles, provisioning",
      },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      {
        href: "/admin/tags",
        label: "Tags",
        icon: Tags,
        description: "Project and profile tags",
      },
      {
        href: "/admin/seed-tags",
        label: "Seed tags",
        icon: Database,
        description: "Bulk tag presets",
      },
      {
        href: "/admin/content",
        label: "Site content",
        icon: FileText,
        description: "Copy and resource blocks",
      },
    ],
  },
  {
    id: "event",
    label: "Event",
    items: [
      {
        href: "/admin/hackathons",
        label: "Hackathons",
        icon: Calendar,
        description: "Editions and registry",
      },
      {
        href: "/admin/voting",
        label: "Voting",
        icon: Vote,
        description: "Tallies and vote windows",
      },
      {
        href: "/admin/live",
        label: "Live display",
        icon: MonitorPlay,
        description: "Projector wall at /live",
      },
    ],
  },
  {
    id: "ops",
    label: "Operations",
    items: [
      {
        href: "/admin/errors",
        label: "Error logs",
        icon: Bug,
        description: "Client and server errors",
      },
      {
        href: "/checkin",
        label: "Check-in desk",
        icon: Ticket,
        description: "Staff check-in and swag",
        matchPrefix: true,
      },
    ],
  },
];

/** Flat list for mobile tabs and account menu. */
export const ADMIN_NAV_FLAT: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

export function isAdminNavItemActive(pathname: string, item: AdminNavItem): boolean {
  if (item.href === "/admin") {
    return pathname === "/admin" || pathname === "/admin/";
  }
  if (item.matchPrefix) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function activeAdminNavGroup(pathname: string): string {
  for (const group of ADMIN_NAV_GROUPS) {
    if (group.items.some((item) => isAdminNavItemActive(pathname, item))) {
      return group.id;
    }
  }
  return ADMIN_NAV_GROUPS[0].id;
}
