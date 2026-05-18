"use client";

import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { AdminProjectsPanel } from "@/components/admin/AdminProjectsPanel";
import { HackathonResultsSummary } from "@/components/HackathonResultsSummary";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { fetchAllProjectsForAdmin } from "@/lib/admin-projects-list";
import type { Submission } from "@/types/submission";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const [projects, setProjects] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchAllProjectsForAdmin()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell
      title="Admin dashboard"
      subtitle="Review submissions, assign winners, and browse every project in draft or final state."
    >
      <div className="space-y-8">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <HackathonResultsSummary projects={projects} />
        )}

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-violet-500" />
            Projects
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/projects">Open full projects view</Link>
          </Button>
        </div>

        <AdminProjectsPanel expandFirst />
      </div>
    </AdminShell>
  );
}
