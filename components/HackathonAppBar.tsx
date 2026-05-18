"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/lib/AuthContext";
import { useHackathonAuth } from "@/components/HackathonAuthShell";
import { HACKATHON_BRAND_LOGO_SRC, HACKATHON_DISPLAY_NAME } from "@/lib/constants";
import {
  isNavItemActive,
  navItemsForUser,
  PARTICIPANT_NAV,
  PUBLIC_NAV,
  type AppNavItem,
} from "@/lib/app-nav";
import { ADMIN_NAV_GROUPS, isAdminNavItemActive } from "@/lib/admin-nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  LogOut,
  Menu,
  UserMinus,
  UserRound,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

function NavLink({
  item,
  className,
  onNavigate,
}: {
  item: AppNavItem;
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isNavItemActive(pathname, item);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "inline-flex items-center gap-2 font-medium tracking-wide whitespace-nowrap transition-colors shrink-0",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
        item.href.startsWith("/admin") && "text-violet-600 dark:text-violet-400",
        className
      )}
    >
      {Icon ? <Icon className="h-5 w-5 opacity-90 shrink-0" aria-hidden /> : null}
      {item.label}
    </Link>
  );
}

function MobileNavDrawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />
      <aside
        className="fixed top-0 right-0 z-[70] flex h-full w-[min(100vw-2.5rem,20rem)] flex-col border-l border-border bg-background shadow-xl lg:hidden animate-in slide-in-from-right duration-200"
        aria-modal="true"
        role="dialog"
        aria-label="Main menu"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4">
          <p className="text-sm font-semibold text-foreground truncate">{title}</p>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">{children}</div>
      </aside>
    </>
  );
}

export function HackathonAppBar() {
  const pathname = usePathname();
  const { user, userProfile, isAuthenticated } = useAuthContext();
  const { openSignIn } = useHackathonAuth();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = userProfile?.role === "admin";
  const isModerator = userProfile?.role === "moderator";
  const isOrganiser = isAdmin || isModerator;
  const navItems = navItemsForUser(isAuthenticated, isAdmin, isOrganiser);
  const participantItems = isAuthenticated ? PARTICIPANT_NAV : PUBLIC_NAV;
  const adminTopLink = isAdmin ? navItems.find((i) => i.href === "/admin") : undefined;
  const mobileNavItems = isAuthenticated ? PARTICIPANT_NAV : PUBLIC_NAV;

  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    closeMobile();
  }, [pathname]);

  const display = user?.displayName || user?.email?.split("@")[0] || "Account";
  const fullName =
    userProfile?.profileDisplayName?.trim() ||
    user?.displayName?.trim() ||
    user?.email?.split("@")[0] ||
    "Attendee";
  const initials = (display
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2) || "?").toUpperCase();

  const isProfileActive = pathname.startsWith("/hackathon/profile");
  const role = userProfile?.role || "user";
  const roleLabel = role === "admin" ? "Admin" : role === "moderator" ? "Moderator" : "User";

  const menuItem =
    "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm text-popover-foreground outline-none transition-colors focus:bg-accent data-[highlighted]:bg-accent";

  const menuLink = (item: AppNavItem) =>
    cn(menuItem, isNavItemActive(pathname, item) && "bg-accent");

  const handleLeaveProgramme = () => {
    toast({
      title: "Leave programme",
      description: "To withdraw from the hackathon, please contact an organiser or your GDG chapter lead.",
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: "Signed out" });
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Sign out failed",
        variant: "destructive",
      });
    }
  };

  const brandTitle = HACKATHON_DISPLAY_NAME.toUpperCase();

  const desktopNavItems = useMemo(() => {
    const items = [...participantItems];
    if (adminTopLink) items.push(adminTopLink);
    return items;
  }, [participantItems, adminTopLink]);

  const navSplitAt = Math.ceil(desktopNavItems.length / 2);
  const navRowOne = desktopNavItems.slice(0, navSplitAt);
  const navRowTwo = desktopNavItems.slice(navSplitAt);

  const brandBlock = (
    <Link href="/hackathon" className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0 group">
      <Image
        src={HACKATHON_BRAND_LOGO_SRC}
        alt="Google I/O"
        width={44}
        height={44}
        className="h-9 w-9 sm:h-10 sm:w-10 object-contain shrink-0"
        priority
      />
      <div className="min-w-0">
        <p className="text-sm sm:text-base font-bold tracking-wide text-foreground leading-tight truncate max-w-[160px] sm:max-w-[260px] lg:max-w-none">
          {brandTitle}
        </p>
        <p className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 leading-tight">
          Build with AI
        </p>
      </div>
    </Link>
  );

  const accountActions = (
    <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden h-10 w-10"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        aria-expanded={mobileOpen}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <ThemeToggle />

      {isAuthenticated && user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center gap-1.5 rounded-lg pl-1 pr-1.5 sm:pr-2 py-1 min-w-0",
                "bg-secondary hover:bg-muted border border-border text-foreground transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              <span className="relative h-8 w-8 shrink-0 rounded-full overflow-hidden bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </span>
              <span className="text-sm font-medium truncate hidden md:inline max-w-[100px] lg:max-w-[140px]">
                {display}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-0 max-h-[min(70vh,32rem)] overflow-y-auto">
            <div className="border-b border-border bg-muted/40 px-3 py-3">
              <p className="text-sm font-semibold text-foreground leading-snug truncate">{fullName}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
              <span
                className={cn(
                  "mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide capitalize",
                  isAdmin && "bg-emerald-600 text-white",
                  isModerator && !isAdmin && "bg-blue-600 text-white",
                  !isAdmin && !isModerator && "bg-muted text-muted-foreground"
                )}
              >
                {roleLabel}
              </span>
            </div>

            <div className="p-1.5 hidden lg:block">
              {PARTICIPANT_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className={menuLink(item)}>
                      {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              {isAdmin ? (
                <>
                  <DropdownMenuSeparator className="my-1 bg-border" />
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    Admin
                  </p>
                  {ADMIN_NAV_GROUPS.map((group) => (
                    <div key={group.id}>
                      <p className="px-3 pt-1 pb-0.5 text-[10px] font-medium text-muted-foreground">
                        {group.label}
                      </p>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isAdminNavItemActive(pathname, item);
                        return (
                          <DropdownMenuItem key={item.href} asChild>
                            <Link href={item.href} className={cn(menuItem, active && "bg-accent")}>
                              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                              {item.label}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  ))}
                </>
              ) : null}
            </div>

            <div className="p-1.5 lg:hidden">
              <DropdownMenuItem asChild>
                <Link href="/hackathon/profile" className={cn(menuItem, isProfileActive && "bg-accent")}>
                  <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                  My profile
                </Link>
              </DropdownMenuItem>
            </div>

            <div className="p-1.5 border-t border-border">
              <DropdownMenuItem
                className={cn(
                  menuItem,
                  "text-amber-400 focus:bg-amber-950/30 focus:text-amber-300 data-[highlighted]:bg-amber-950/25"
                )}
                onSelect={(e) => {
                  e.preventDefault();
                  handleLeaveProgramme();
                }}
              >
                <UserMinus className="h-4 w-4 shrink-0" />
                Leave programme
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-border" />
              <DropdownMenuItem
                className={cn(
                  menuItem,
                  "text-rose-400 focus:bg-rose-950/35 focus:text-rose-300 data-[highlighted]:bg-rose-950/25"
                )}
                onSelect={(e) => {
                  e.preventDefault();
                  void handleSignOut();
                }}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Sign out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="hidden sm:flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-border bg-card/80"
            onClick={() => openSignIn()}
          >
            Sign in
          </Button>
          <Button variant="default" size="sm" asChild className="bg-violet-600 hover:bg-violet-500">
            <Link href="/register">Register</Link>
          </Button>
        </div>
      )}
    </div>
  );

  const mobileDrawerContent = (
    <nav className="flex flex-col gap-1">
      {mobileNavItems.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          onNavigate={closeMobile}
          className="w-full rounded-lg px-3 py-3 text-base min-h-[44px]"
        />
      ))}
      {isAuthenticated ? (
        <>
          <div className="my-2 h-px bg-border" />
          <Link
            href="/hackathon/profile"
            onClick={closeMobile}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base font-medium min-h-[44px] transition-colors",
              isProfileActive
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <UserRound className="h-5 w-5 shrink-0" />
            My profile
          </Link>
          {isAdmin ? (
            <>
              <div className="my-2 h-px bg-border" />
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Admin
              </p>
              {ADMIN_NAV_GROUPS.flatMap((g) => g.items).map((item) => {
                const Icon = item.icon;
                const active = isAdminNavItemActive(pathname, item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base font-medium min-h-[44px] transition-colors",
                      active
                        ? "bg-violet-600/15 text-violet-700 dark:text-violet-300"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          ) : null}
        </>
      ) : (
        <div className="mt-4 flex flex-col gap-2 px-1">
          <Button
            type="button"
            variant="outline"
            className="w-full min-h-[44px]"
            onClick={() => {
              closeMobile();
              openSignIn();
            }}
          >
            Sign in
          </Button>
          <Button variant="default" className="w-full min-h-[44px] bg-violet-600 hover:bg-violet-500" asChild>
            <Link href="/register" onClick={closeMobile}>
              Register
            </Link>
          </Button>
        </div>
      )}
    </nav>
  );


  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto max-w-6xl px-4 sm:px-8">
        <div className="flex items-center justify-between gap-3 py-2.5 lg:py-3 min-h-[3.75rem]">
          {brandBlock}
          {accountActions}
        </div>
        <nav
          className="hidden lg:flex flex-col items-center gap-1.5 border-t border-border/60 pt-2 pb-2.5"
          aria-label="Main navigation"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-6 xl:gap-x-8 gap-y-1">
            {navRowOne.map((item) => (
              <NavLink key={item.href} item={item} className="text-[14px] xl:text-[15px]" />
            ))}
          </div>
          {navRowTwo.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-x-6 xl:gap-x-8 gap-y-1">
              {navRowTwo.map((item) => (
                <NavLink key={item.href} item={item} className="text-[14px] xl:text-[15px]" />
              ))}
            </div>
          ) : null}
        </nav>
      </div>
      <MobileNavDrawer open={mobileOpen} onClose={closeMobile} title="Menu">
        {mobileDrawerContent}
      </MobileNavDrawer>
    </header>
  );
}
