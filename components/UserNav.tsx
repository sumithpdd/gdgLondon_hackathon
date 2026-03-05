"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Shield, UserCog, User } from "lucide-react";
import { useAuthContext } from "@/lib/AuthContext";

export function UserNav() {
  const { user, userProfile } = useAuthContext();
  
  if (!user || !userProfile) return null;

  const role = userProfile.role || 'user';

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-red-600 text-white flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Admin
          </Badge>
        );
      case 'moderator':
        return (
          <Badge className="bg-blue-600 text-white flex items-center gap-1">
            <UserCog className="w-3 h-3" />
            Moderator
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-200 text-gray-700 flex items-center gap-1">
            <User className="w-3 h-3" />
            User
          </Badge>
        );
    }
  };

  return (
    <div className="flex items-center gap-3">
      {getRoleBadge()}
      
      {role === 'admin' && (
        <Link href="/admin">
          <Button variant="outline" size="sm" className="border-red-600 text-red-600 hover:bg-red-50">
            <Shield className="w-4 h-4 mr-2" />
            Admin Panel
          </Button>
        </Link>
      )}
      
      {role === 'moderator' && (
        <Link href="/admin">
          <Button variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <UserCog className="w-4 h-4 mr-2" />
            View Panel
          </Button>
        </Link>
      )}
    </div>
  );
}

