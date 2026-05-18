"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useAuthContext } from "@/lib/AuthContext";
import {
  deleteProjectAsAdmin,
  setProjectWinnerPlace,
  callableErrorMessage,
} from "@/lib/admin-projects";
import {
  fetchAllProjectsForAdmin,
  filterAdminProjects,
  type AdminProjectStatusFilter,
} from "@/lib/admin-projects-list";
import type { Submission } from "@/types/submission";
import { AdminProjectCard } from "@/components/admin/AdminProjectCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { id: AdminProjectStatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "submitted", label: "Final" },
];

type Props = {
  /** Expand first card by default (dashboard preview). */
  expandFirst?: boolean;
};

export function AdminProjectsPanel({ expandFirst = false }: Props) {
  const { user, userProfile } = useAuthContext();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminProjectStatusFilter>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllProjectsForAdmin();
      setProjects(data);
    } catch (e) {
      console.error(e);
      toast({
        title: "Could not load projects",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && userProfile) void load();
  }, [user, userProfile, load]);

  const filtered = useMemo(
    () => filterAdminProjects(projects, { search, status: statusFilter }),
    [projects, search, statusFilter]
  );

  const counts = useMemo(
    () => ({
      all: projects.length,
      draft: projects.filter((p) => p.status === "draft").length,
      submitted: projects.filter(
        (p) => p.status === "submitted" || p.status === "finalist" || p.status === "winner"
      ).length,
    }),
    [projects]
  );

  const handlePlaceChange = async (projectId: string, place: string) => {
    if (!user) return;
    try {
      const newPlace = place === "none" ? null : (place as "first" | "second" | "third");
      await setProjectWinnerPlace(projectId, newPlace);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, place: newPlace } : p))
      );
      toast({ title: "Winner place updated" });
    } catch (e) {
      toast({
        title: "Update failed",
        description: callableErrorMessage(e),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteProjectAsAdmin(deleteId);
      setProjects((prev) => prev.filter((p) => p.id !== deleteId));
      toast({ title: "Project deleted" });
    } catch (e) {
      toast({
        title: "Delete failed",
        description: callableErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title, team, email, GitHub…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.id}
              type="button"
              size="sm"
              variant={statusFilter === f.id ? "default" : "outline"}
              className={cn(statusFilter === f.id && "bg-violet-600 hover:bg-violet-500")}
              onClick={() => setStatusFilter(f.id)}
            >
              {f.label}
              <span className="ml-1.5 text-xs opacity-80">({counts[f.id]})</span>
            </Button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {projects.length} projects — draft and final submissions.
      </p>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No projects match your filters.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((project, i) => (
            <AdminProjectCard
              key={project.id}
              project={project}
              onPlaceChange={handlePlaceChange}
              onDelete={setDeleteId}
              defaultExpanded={expandFirst && i === 0}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently removes the project and its screenshots. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
