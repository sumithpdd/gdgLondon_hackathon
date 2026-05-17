"use client";

import { Badge } from "@/components/ui/badge";
import { Shield, UserCog, User } from "lucide-react";
import type { UserProfile, UserRole } from "@/lib/auth";
import { isUserDeleted } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function AdminUserRoleBadge({ role }: { role: UserRole | string }) {
  if (role === "admin") {
    return (
      <Badge className="bg-red-600/90 text-white border-0">
        <Shield className="w-3 h-3 mr-1" />
        Admin
      </Badge>
    );
  }
  if (role === "moderator") {
    return (
      <Badge className="bg-blue-600/90 text-white border-0">
        <UserCog className="w-3 h-3 mr-1" />
        Moderator
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-white/10 text-gray-200 border border-white/10">
      <User className="w-3 h-3 mr-1" />
      User
    </Badge>
  );
}

type MetaBadgesProps = {
  user: UserProfile;
  profilePercent: number;
  profileComplete: boolean;
  listedFromLegacy?: boolean;
};

export function AdminUserMetaBadges({
  user,
  profilePercent,
  profileComplete,
  listedFromLegacy,
}: MetaBadgesProps) {
  return (
    <>
      {listedFromLegacy && (
        <Badge className="bg-violet-900/50 text-violet-200 border border-violet-500/40">
          Legacy profile
        </Badge>
      )}
      {isUserDeleted(user) && (
        <Badge className="bg-amber-900/60 text-amber-200 border border-amber-500/40">Deleted</Badge>
      )}
      {user.adminProvisioned && user.profileStatus === "provisioned" && (
        <Badge className="bg-sky-900/50 text-sky-200 border border-sky-500/40">Provisioned</Badge>
      )}
      <Badge
        variant="outline"
        className={cn(
          profileComplete
            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
            : "border-amber-500/40 bg-amber-500/10 text-amber-200"
        )}
      >
        Profile {profilePercent}%
      </Badge>
    </>
  );
}
