"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/lib/AuthContext";
import { getHackathonConfig } from "@/lib/hackathon-config";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Scale,
  Gift,
  GalleryHorizontalEnd,
  Lightbulb,
  FolderKanban,
} from "lucide-react";

const STATIC_TABS = [
  { href: "/hackathon", label: "Overview", icon: LayoutDashboard },
  { href: "/hackathon/prizes", label: "Prizes", icon: Gift },
  { href: "/hackathon/ideas", label: "Idea Gallery", icon: Lightbulb },
  { href: "/hackathon/participants", label: "Participants", icon: Users },
  { href: "/hackathon/resources", label: "Resources", icon: BookOpen },
  { href: "/hackathon/rules", label: "Rules", icon: Scale },
];

const AUTH_TABS = [
  { href: "/hackathon/my-projects", label: "My Project", icon: FolderKanban },
];

const GALLERY_TAB = { href: "/hackathon/gallery", label: "Project Gallery", icon: GalleryHorizontalEnd };

export function HackathonNav() {
  const pathname = usePathname();
  const { isAuthenticated, userProfile } = useAuthContext();
  const [winnersAnnounced, setWinnersAnnounced] = useState(false);

  useEffect(() => {
    getHackathonConfig().then((config) => setWinnersAnnounced(config.winnersAnnounced));
  }, []);

  const isAdmin = userProfile?.role === "admin";
  const showGallery = isAdmin || winnersAnnounced;
  const tabs = [
    ...STATIC_TABS,
    ...(showGallery ? [GALLERY_TAB] : []),
    ...(isAuthenticated ? AUTH_TABS : []),
  ];

  return (
    <nav className="border-b border-white/10 bg-[#0d0d14]/80">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-center gap-2 overflow-x-auto scrollbar-hide py-2">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href !== "/hackathon" && pathname.startsWith(tab.href));
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                  isActive
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                    : "text-white hover:bg-white/10"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
