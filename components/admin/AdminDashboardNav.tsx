"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ADMIN_NAV_GROUPS,
  activeAdminNavGroup,
  isAdminNavItemActive,
  type AdminNavItem,
} from "@/lib/admin-nav";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function NavLink({ item, compact }: { item: AdminNavItem; compact?: boolean }) {
  const pathname = usePathname();
  const active = isAdminNavItemActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-violet-600/15 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500/30"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        compact && "py-2"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 mt-0.5",
          active ? "text-violet-600 dark:text-violet-400" : "opacity-70"
        )}
      />
      <span className="min-w-0">
        <span className={cn("font-medium block", active && "text-foreground")}>{item.label}</span>
        {!compact && item.description ? (
          <span className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</span>
        ) : null}
      </span>
    </Link>
  );
}

/** Grouped sidebar (desktop) + section tabs + scroll pills (mobile). */
export function AdminDashboardNav() {
  const pathname = usePathname();
  const activeGroupId = activeAdminNavGroup(pathname);
  const activeGroup = ADMIN_NAV_GROUPS.find((g) => g.id === activeGroupId) ?? ADMIN_NAV_GROUPS[0];

  return (
    <>
      <div className="lg:hidden space-y-3 mb-6 sticky top-[3.75rem] z-40 -mx-4 px-4 py-3 bg-background/95 backdrop-blur border-b border-border">
        <Tabs value={activeGroupId} className="w-full">
          <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1 bg-muted/80 p-1">
            {ADMIN_NAV_GROUPS.map((group) => (
              <TabsTrigger
                key={group.id}
                value={group.id}
                className="text-xs sm:text-sm px-2.5 sm:px-3 data-[state=active]:bg-background"
                asChild
              >
                <Link href={group.items[0].href}>{group.label}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {activeGroup.items.map((item) => {
            const active = isAdminNavItemActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                  active
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <aside className="hidden lg:block w-60 xl:w-64 shrink-0">
        <nav className="sticky top-24 space-y-6 pr-2">
          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.id}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
