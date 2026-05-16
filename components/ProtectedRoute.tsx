"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/AuthContext";
import { isUserDeleted } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuthContext();
  const router = useRouter();
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User not authenticated, redirect to hackathon (Firebase login available there)
        router.push("/hackathon");
      } else if (requireAdmin && userProfile?.role !== "admin") {
        // User is not admin, redirect to hackathon
        router.push("/hackathon");
      }
    }
  }, [user, userProfile, loading, requireAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && userProfile?.role !== "admin") {
    return null;
  }

  if (!requireAdmin && userProfile && isUserDeleted(userProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
        <div className="max-w-md text-center space-y-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-8">
          <h1 className="text-xl font-semibold text-white">Account deactivated</h1>
          <p className="text-gray-400 text-sm">
            This profile has been marked as deleted. Contact the organisers if you believe this is a mistake.
          </p>
          <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Link href="/hackathon">Back to hackathon hub</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

