"use client";

import { Shield } from "lucide-react";
import { PlatformChrome } from "@/components/PlatformChrome";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminDashboardNav } from "@/components/admin/AdminDashboardNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAdmin>
      <PlatformChrome mainClassName="container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/15 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/25">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Admin</h1>
              <p className="text-sm text-muted-foreground">Organiser tools — use the menu to switch sections</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          <AdminDashboardNav />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </PlatformChrome>
    </ProtectedRoute>
  );
}
