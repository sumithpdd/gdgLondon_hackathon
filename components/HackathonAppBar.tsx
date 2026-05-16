"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/lib/AuthContext";
import {
  HACKATHON_DISPLAY_NAME,
  BUDDIES_FEATURE_LABEL,
} from "@/lib/constants";
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
  Shield,
  UserRound,
  Home,
  Lightbulb,
  FolderOpen,
  Users,
  Ticket,
  UserMinus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/hackathon") {
    return pathname === "/hackathon" || pathname === "/hackathon/";
  }
  if (href === "/past-projects") {
    return pathname.startsWith("/past-projects");
  }
  if (href === "/hackathon/my-projects") {
    return pathname === "/hackathon/my-projects" || pathname.startsWith("/hackathon/my-projects/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = isNavActive(pathname, href);
  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium tracking-wide whitespace-nowrap transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

export function HackathonAppBar() {
  const pathname = usePathname();
  const { user, userProfile, isAuthenticated } = useAuthContext();
  const { toast } = useToast();

  const isAdmin = userProfile?.role === "admin";
  const isModerator = userProfile?.role === "moderator";

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

  const menuLinkActive = (href: string) => isNavActive(pathname, href);

  const menuItem =
    "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm text-popover-foreground outline-none transition-colors focus:bg-accent data-[highlighted]:bg-accent";
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
      <div className="container mx-auto max-w-6xl px-4 py-2.5 flex items-center gap-4 min-h-[3.25rem]">
        {/* Brand — AI DevCamp style */}
        <Link href="/hackathon" className="flex items-center gap-3 shrink-0 group">
          <div className="h-10 w-10 shrink-0 rounded-md bg-emerald-600 flex flex-col items-center justify-center text-[8px] font-bold leading-tight text-center text-white px-0.5 shadow-none">
            IO
            <span className="text-[7px] font-semibold opacity-95">2026</span>
          </div>
          <div className="hidden sm:block min-w-0">
            <div className="text-sm sm:text-base font-bold tracking-wide text-foreground leading-tight truncate max-w-[200px] sm:max-w-[280px]">
              {title}
            </div>
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 leading-tight">Build with AI</div>
          </div>
        </Link>

        {/* Primary links: same core routes for guests (browse) and signed-in users; account menu has duplicates + profile/admin/sign out. */}
        <nav className="flex-1 flex items-center justify-end md:justify-center gap-5 sm:gap-7 md:gap-8 overflow-x-auto scrollbar-hide py-1 min-w-0">
          {!isAuthenticated ? (
            <>
              <NavLink href="/hackathon">Home</NavLink>
              <NavLink href="/hackathon/ideas">Ideas</NavLink>
              <NavLink href="/hackathon/resources">Resources &amp; rules</NavLink>
              <NavLink href="/past-projects">Past</NavLink>
            </>
          ) : (
            <>
              <NavLink href="/hackathon">Home</NavLink>
              <NavLink href="/hackathon/ideas">Ideas</NavLink>
              <NavLink href="/hackathon/my-projects">My project</NavLink>
              <NavLink href="/hackathon/buddies">{BUDDIES_FEATURE_LABEL}</NavLink>
              <NavLink href="/checkin">Check-in</NavLink>
            </>
          )}
        </nav>

        {/* Profile + theme */}
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
                      // eslint-disable-next-line @next/next/no-img-element -- Google OAuth URLs vary by host
                      <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </span>
                  <span className="text-sm font-medium truncate hidden sm:inline max-w-[120px]">
                    {display}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-0">
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
                  <DropdownMenuItem asChild>
                    <Link
                      href="/hackathon"
                      className={cn(menuItem, menuLinkActive("/hackathon") && "bg-accent")}
                    >
                      <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
                      Home
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/hackathon/ideas"
                      className={cn(menuItem, menuLinkActive("/hackathon/ideas") && "bg-accent")}
                    >
                      <Lightbulb className="h-4 w-4 shrink-0 text-muted-foreground" />
                      Ideas
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/hackathon/my-projects"
                      className={cn(
                        menuItem,
                        menuLinkActive("/hackathon/my-projects") && "bg-accent"
                      )}
                    >
                      <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                      My project
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/hackathon/buddies"
                      className={cn(menuItem, menuLinkActive("/hackathon/buddies") && "bg-accent")}
                    >
                      <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {BUDDIES_FEATURE_LABEL}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/checkin" className={cn(menuItem, menuLinkActive("/checkin") && "bg-accent")}>
                      <Ticket className="h-4 w-4 shrink-0 text-muted-foreground" />
                      Check-in
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className={cn(menuItem, menuLinkActive("/admin") && "bg-accent")}>
                        <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
                        Admin area
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link
                      href="/hackathon/profile"
                      className={cn(menuItem, isProfileActive && "bg-accent")}
                    >
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
            <Button variant="outline" size="sm" asChild className="border-border bg-card/80">
              <Link href="/register">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
