"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/lib/AuthContext";
import { useHackathonAuth } from "@/components/HackathonAuthShell";
import { HACKATHON_DISPLAY_NAME } from "@/lib/constants";
import {
  ADMIN_NAV,
  isNavItemActive,
  navItemsForUser,
  PARTICIPANT_NAV,
  type AppNavItem,
} from "@/lib/app-nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, Shield, UserRound, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

function NavLink({ item }: { item: AppNavItem }) {
  const pathname = usePathname();
  const active = isNavItemActive(pathname, item);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium tracking-wide whitespace-nowrap transition-colors shrink-0",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
        item.href.startsWith("/admin") && "text-violet-600 dark:text-violet-400"
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 opacity-80" /> : null}
      {item.label}
    </Link>
  );
}

export function HackathonAppBar() {
  const pathname = usePathname();
  const { user, userProfile, isAuthenticated } = useAuthContext();
  const { openSignIn } = useHackathonAuth();
  const { toast } = useToast();

  const isAdmin = userProfile?.role === "admin";
  const isModerator = userProfile?.role === "moderator";
  const isOrganiser = isAdmin || isModerator;
  const navItems = navItemsForUser(isAuthenticated, isAdmin, isOrganiser);
  const participantItems = isAuthenticated ? PARTICIPANT_NAV : navItems;
  const adminItems = isAdmin ? ADMIN_NAV : [];

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

  const title = HACKATHON_DISPLAY_NAME.toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto max-w-6xl px-4 py-2.5 flex items-center gap-3 min-h-[3.25rem]">
        <Link href="/hackathon" className="flex items-center gap-3 shrink-0 group">
          <div className="h-10 w-10 shrink-0 rounded-md bg-emerald-600 flex flex-col items-center justify-center text-[8px] font-bold leading-tight text-center text-white px-0.5 shadow-none">
            IO
            <span className="text-[7px] font-semibold opacity-95">2026</span>
          </div>
          <div className="hidden sm:block min-w-0">
            <div className="text-sm sm:text-base font-bold tracking-wide text-foreground leading-tight truncate max-w-[200px] sm:max-w-[240px]">
              {title}
            </div>
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 leading-tight">Build with AI</div>
          </div>
        </Link>

        <nav className="flex-1 flex items-center justify-end md:justify-center gap-4 sm:gap-5 md:gap-6 overflow-x-auto scrollbar-hide py-1 min-w-0">
          {participantItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
          {adminItems.length > 0 && (
            <>
              <span className="hidden md:inline h-5 w-px bg-border shrink-0" aria-hidden />
              {adminItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </>
          )}
        </nav>

        <div className="shrink-0 flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 min-w-0 max-w-[200px]",
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
                  <span className="text-sm font-medium truncate hidden sm:inline max-w-[120px]">{display}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
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

                <div className="p-1.5">
                  {navItems.map((item) => {
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
                  <DropdownMenuItem asChild>
                    <Link href="/hackathon/profile" className={cn(menuItem, isProfileActive && "bg-accent")}>
                      <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                      My profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 bg-border" />

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
            <div className="flex items-center gap-2">
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
      </div>
    </header>
  );
}
