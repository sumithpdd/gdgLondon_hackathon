"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HACKATHON_DISPLAY_NAME } from "@/lib/constants";
import {
  LayoutDashboard,
  Users,
  Tags,
  Database,
  Shield,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems: {
  id: string;
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: "dashboard", href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { id: "hackathons", href: "/admin/hackathons", label: "Hackathons", icon: Calendar },
  { id: "users", href: "/admin/users", label: "Users", icon: Users },
  { id: "tags", href: "/admin/tags", label: "Tags", icon: Tags },
  { id: "seed-tags", href: "/admin/seed-tags", label: "Seed tags", icon: Database },
];

export function AdminShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground bg-gradient-to-b from-background via-background to-muted/40">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto max-w-6xl px-4 py-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/hackathon" className="flex items-center gap-3 shrink-0 group">
              <div className="h-10 w-10 shrink-0 rounded-md bg-emerald-600 flex flex-col items-center justify-center text-[8px] font-bold leading-tight text-center text-white px-0.5">
                IO
                <span className="text-[7px] font-semibold opacity-95">2026</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold tracking-wide text-foreground leading-tight truncate">
                  {HACKATHON_DISPLAY_NAME}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 leading-tight">
                  <Shield className="h-3 w-3" />
                  Admin
                </div>
              </div>
            </Link>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            {navItems.map(({ id, href, label, icon: Icon }) => {
              const active =
                id === "dashboard"
                  ? pathname === "/admin" || pathname === "/admin/"
                  : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link key={href} href={href}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-1.5 rounded-lg border border-transparent",
                      active
                        ? "bg-primary/15 text-primary border-primary/30 hover:bg-primary/20"
                        : "text-foreground/90 hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-90" />
                    {label}
                  </Button>
                </Link>
              );
            })}
            <Link href="/hackathon" className="ml-auto lg:ml-0">
              <Button type="button" variant="outline" size="sm">
                Exit to hackathon
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle ? (
            <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-3xl">{subtitle}</p>
          ) : null}
        </div>
        {children}
      </main>
    </div>
  );
}
