"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { HackathonResultsSummary } from "@/components/HackathonResultsSummary";
import {
  fetchArchivedHackathonProjects,
  deleteArchivedProjectAsAdmin,
  type ArchivedProject,
} from "@/lib/archived-hackathon";
import { PastArchiveGallery } from "@/components/past-projects/PastArchiveGallery";
import { useAuthContext } from "@/lib/AuthContext";
import { callableErrorMessage } from "@/lib/admin-projects";
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

export default function PastProjectsPage() {
  const { userProfile } = useAuthContext();
  const { toast } = useToast();
  const isAdmin = userProfile?.role === "admin";

  const [projects, setProjects] = useState<ArchivedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArchivedProject | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchArchivedHackathonProjects();
      setProjects(data.projects);
    } catch (e) {
      console.error(e);
      setError("Could not load archived projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteArchivedProjectAsAdmin(deleteTarget.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast({ title: "Archived project deleted" });
      setDeleteTarget(null);
    } catch (e) {
      toast({
        title: "Delete failed",
        description: callableErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Past projects &amp; winners</h1>
      <p className="text-gray-400 mb-2">IWD 2026 hackathon — winners, archived gallery, and submissions.</p>
      <p className="text-sm text-gray-500 mb-8">
        For the live event, browse current team ideas on{" "}
        <Link href="/hackathon/ideas" className="text-violet-300 underline hover:text-white">
          Idea gallery
        </Link>
        .
      </p>

      {loading && <p className="text-gray-500">Loading…</p>}
      {error && <p className="text-amber-400">{error}</p>}

      {!loading && !error && projects.length > 0 && (
        <section className="mb-12">
          <HackathonResultsSummary
            projects={projects}
            title="Competition winners (IWD 2026)"
          />
        </section>
      )}

      {!loading && !error && projects.length === 0 && (
        <p className="text-gray-500 mb-8">
          No archived projects yet. Data is managed in Firebase (IWD 2026 archive).
        </p>
      )}

      {!loading && !error && projects.length > 0 && (
        <PastArchiveGallery
          projects={projects}
          isAdmin={isAdmin}
          deletingId={deletingId}
          onDelete={(id) => {
            const p = projects.find((x) => x.id === id);
            if (p) setDeleteTarget(p);
          }}
        />
      )}

      <section id="past-hackathons" className="mb-12 scroll-mt-24 mt-12">
        <h2 className="text-lg font-semibold text-white mb-2">Past hackathons &amp; side events</h2>
        <p className="text-sm text-gray-500 mb-4">
          Completed activities — links may still work for replays or leaderboards.
        </p>
        <article className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#1a0a2e]/90 via-[#0f1a0a]/90 to-[#1a0a2e]/90 p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
          <div className="relative w-full sm:w-40 h-40 shrink-0 rounded-xl overflow-hidden mx-auto sm:mx-0">
            <Image
              src="/garden_adventure.png"
              alt="The Garden of the Forgotten Prompt — archived side event"
              fill
              className="object-cover"
              sizes="160px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-white">The Garden of the Forgotten Prompt</h3>
            <p className="text-emerald-300 text-sm font-medium mt-1">Adventures await! (archived)</p>
            <p className="text-gray-400 text-sm mt-2">Wed 11 March, 11:00 PM — Sat 14 March, 6:00 PM</p>
            <div className="flex flex-wrap gap-3 mt-4">
              <a
                href="https://adventure.wietsevenema.eu/e/gdg-london"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-sm font-semibold"
              >
                Play the adventure <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </article>
      </section>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="border-white/10 bg-[#14101f] text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete archived project?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Permanently remove{" "}
              <strong className="text-gray-200">
                {deleteTarget?.projectTitle || deleteTarget?.teamName || "Untitled"}
              </strong>{" "}
              from the IWD 2026 archive. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 bg-transparent text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!!deletingId}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {deletingId ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
