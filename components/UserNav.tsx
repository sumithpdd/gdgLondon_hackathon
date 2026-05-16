"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Shield, UserCog, User } from "lucide-react";
import { useAuthContext } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

type Tone = "light" | "dark";

export function UserNav({ tone = "light" }: { tone?: Tone }) {
  const { user, userProfile } = useAuthContext();

  if (!user || !userProfile) return null;

  const role = userProfile.role || "user";
  const isDark = tone === "dark";

  const getRoleBadge = () => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-red-600 text-white flex items-center gap-1 shrink-0">
            <Shield className="w-3 h-3" />
            Admin
          </Badge>
        );
      case "moderator":
        return (
          <Badge className="bg-blue-600 text-white flex items-center gap-1 shrink-0">
            <UserCog className="w-3 h-3" />
            Moderator
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className={cn(
              "flex items-center gap-1 shrink-0",
              isDark ? "bg-white/10 text-gray-200 border border-white/15" : "bg-gray-200 text-gray-700"
            )}
          >
            <User className="w-3 h-3" />
            User
          </Badge>
        );
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
      {getRoleBadge()}

      {role === "admin" && (
        <Link href="/admin">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "shrink-0 font-medium rounded-lg",
              isDark
                ? "border-0 bg-red-600 text-white hover:bg-red-500 shadow-none"
                : "border border-red-600 text-red-600 hover:bg-red-50 bg-white"
            )}
          >
            <Shield className="w-4 h-4 mr-2" />
            Admin Panel
          </Button>
        </Link>
      )}

      {role === "moderator" && (
        <Link href="/admin">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "shrink-0 font-medium rounded-lg",
              isDark
                ? "border-0 bg-blue-600 text-white hover:bg-blue-500 shadow-none"
                : "border border-blue-600 text-blue-600 hover:bg-blue-50 bg-white"
            )}
          >
            <UserCog className="w-4 h-4 mr-2" />
            View Panel
          </Button>
        </Link>
      )}
    </div>
  );
}
