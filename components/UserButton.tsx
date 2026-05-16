"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/lib/AuthContext";
import Link from "next/link";
import { LogOut, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Tone = "light" | "dark";

export function UserButton({
  tone = "light",
  showProfileLink = true,
}: {
  tone?: Tone;
  /** Set false when a parent layout already links to profile (e.g. hackathon nav tabs). */
  showProfileLink?: boolean;
}) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const isDark = tone === "dark";

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  const btnLightOutline = "border-gray-300 text-gray-800 bg-white hover:bg-gray-50";
  const btnDarkSolid =
    "border-0 bg-violet-600 text-white hover:bg-violet-500 shadow-none font-medium rounded-lg";
  const btnOutline = isDark ? btnDarkSolid : btnLightOutline;

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end min-w-0">
      {showProfileLink && (
        <Button variant="outline" size="sm" asChild className={cn("shrink-0", btnOutline)}>
          <Link href="/hackathon/profile">
            <UserIcon className="w-4 h-4 mr-2" />
            Profile
          </Link>
        </Button>
      )}
      <div className={cn("flex items-center gap-2 text-sm min-w-0", isDark ? "text-white" : "")}>
        <UserIcon className={cn("w-4 h-4 shrink-0", isDark ? "text-violet-200" : "")} />
        <span className="font-medium truncate max-w-[140px] sm:max-w-[220px]">
          {user.displayName || user.email}
        </span>
      </div>
      <Button variant="outline" size="sm" onClick={handleSignOut} className={cn("shrink-0", btnOutline)}>
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}
