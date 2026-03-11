"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { Submission } from "@/types/submission";
import { getProjectTitle, getTeamName, getShortDescription } from "@/lib/submission-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Search, Eye, Trophy, AlertTriangle, Trash2, RotateCcw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { HACKATHON_START_DATE, PROJECTS_COLLECTION } from "@/lib/constants";
import { useAuthContext } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getHackathonConfig } from "@/lib/hackathon-config";

type SortOption = "recent" | "liked" | "viewed" | "trending";

export default function ProjectGalleryPage() {
  const { user, userProfile } = useAuthContext();
  const { toast } = useToast();
  const isAdmin = userProfile?.role === "admin";
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filterStartDate, setFilterStartDate] = useState<"all" | "yes" | "no">("all");
  const [filterPitchFinalist, setFilterPitchFinalist] = useState(false);
  const [filterProjectType, setFilterProjectType] = useState<"all" | "solo" | "team">("all");
  const [winnersAnnounced, setWinnersAnnounced] = useState(false);
  const [announcing, setAnnouncing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetHackathon = async () => {
    if (!user || !isAdmin) return;
    setResetting(true);
    try {
      const resetFn = httpsCallable(functions, "resetHackathon");
      await resetFn({});
      setWinnersAnnounced(false);
      setSubmissions([]);
      setShowResetConfirm(false);
      toast({ title: "Hackathon reset", description: "All projects cleared. Ready for a new hackathon!" });
    } catch (error: any) {
      console.error("Error resetting hackathon:", error);
      toast({ title: "Error", description: error?.message || "Failed to reset.", variant: "destructive" });
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteProject = async (submissionId: string, title: string) => {
    if (!user || !isAdmin) return;
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(submissionId);
    try {
      const deleteProjectFn = httpsCallable(functions, "deleteProject");
      await deleteProjectFn({ projectId: submissionId });
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      toast({ title: "Project deleted", description: `"${title}" has been removed.` });
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast({ title: "Error", description: error?.message || "Failed to delete project.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handlePlaceChange = async (submissionId: string, place: string) => {
    if (!user || !isAdmin || winnersAnnounced) return;
    try {
      const setWinnerPlace = httpsCallable(functions, "setWinnerPlace");
      await setWinnerPlace({ projectId: submissionId, place: place || null });
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId ? { ...s, place: (place || null) as Submission["place"] } : s
        )
      );
      toast({
        title: place ? `Winner set: ${place} place` : "Winner removed",
        description: `Updated successfully.`,
      });
    } catch (error: any) {
      console.error("Error updating place:", error);
      toast({ title: "Error", description: error?.message || "Failed to update winner.", variant: "destructive" });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [config] = await Promise.all([getHackathonConfig()]);
        setWinnersAnnounced(config.winnersAnnounced);

        const q = query(
          collection(db, PROJECTS_COLLECTION),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.(),
        })) as Submission[];
        const submittedOnly = data.filter((s) => s.status === "submitted");
        setSubmissions(submittedOnly);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // If not admin and winners not announced, don't show the page
  if (!loading && !winnersAnnounced && !isAdmin) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>The Project Gallery will be available once winners are announced.</p>
      </div>
    );
  }

  const winners = {
    first: submissions.find((s) => s.place === "first"),
    second: submissions.find((s) => s.place === "second"),
    third: submissions.find((s) => s.place === "third"),
  };

  const canAnnounce = winners.first && winners.second && winners.third;

  const handleAnnounceWinners = async () => {
    if (!user || !canAnnounce) return;
    setAnnouncing(true);
    try {
      const announceWinnersFn = httpsCallable(functions, "announceWinners");
      await announceWinnersFn({});
      setWinnersAnnounced(true);
      setShowConfirmDialog(false);
      toast({ title: "Winners announced!", description: "The Project Gallery is now public and winners are visible to everyone." });
    } catch (error: any) {
      console.error("Error announcing winners:", error);
      toast({ title: "Error", description: error?.message || "Failed to announce winners.", variant: "destructive" });
    } finally {
      setAnnouncing(false);
    }
  };

  const filteredAndSorted = (() => {
    let result = [...submissions];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          getProjectTitle(s).toLowerCase().includes(q) ||
          getTeamName(s).toLowerCase().includes(q) ||
          (s.appPurpose || "").toLowerCase().includes(q) ||
          (s.aiToolsUsed || []).some((t) => t.toLowerCase().includes(q)) ||
          (s.builtWith || []).some((b) => b.toLowerCase().includes(q))
      );
    }

    if (filterStartDate !== "all") {
      result = result.filter((s) => {
        const startDate = s.projectStartDate
          ? new Date(s.projectStartDate)
          : s.createdAt
          ? new Date(s.createdAt)
          : null;
        if (!startDate) return filterStartDate === "no";
        const afterHackathon = startDate >= HACKATHON_START_DATE;
        return filterStartDate === "yes" ? afterHackathon : !afterHackathon;
      });
    }

    if (filterPitchFinalist) {
      result = result.filter((s) => s.pitchFinalist === true);
    }

    if (filterProjectType !== "all") {
      result = result.filter((s) => s.projectType === filterProjectType);
    }

    // Sort: winners first, then by selected sort
    switch (sortBy) {
      case "liked":
        result.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
        break;
      case "viewed":
        result.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
        break;
      case "trending":
        result.sort(
          (a, b) =>
            (b.likes ?? 0) * 2 +
            (b.views ?? 0) -
            ((a.likes ?? 0) * 2 + (a.views ?? 0))
        );
        break;
      default:
        result.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
    }

    // If winners announced, sort winners to the top
    if (winnersAnnounced) {
      const placeOrder: Record<string, number> = { first: 0, second: 1, third: 2 };
      result.sort((a, b) => {
        const aPlace = a.place ? placeOrder[a.place] ?? 99 : 99;
        const bPlace = b.place ? placeOrder[b.place] ?? 99 : 99;
        return aPlace - bPlace;
      });
    }

    return result;
  })();

  const getLabelRibbon = (s: Submission) => {
    if (s.place === "first") return { text: "1ST PLACE", className: "bg-amber-500 text-white" };
    if (s.place === "second") return { text: "2ND PLACE", className: "bg-gray-400 text-white" };
    if (s.place === "third") return { text: "3RD PLACE", className: "bg-amber-700 text-white" };
    if (s.label === "finalist") return { text: "FINALIST", className: "bg-slate-600 text-white" };
    if (s.label === "featured") return { text: "FEATURED", className: "bg-violet-600 text-white" };
    return null;
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto">
      {/* Admin: Announce Winners bar */}
      {isAdmin && !winnersAnnounced && (
        <div className="p-4 bg-amber-500/10 border border-amber-400/30 rounded-2xl">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-amber-400 shrink-0" />
              <div>
                <p className="text-white font-semibold">Select Winners</p>
                <p className="text-sm text-gray-400">
                  {canAnnounce
                    ? "All 3 places selected. Ready to announce!"
                    : `Select 1st, 2nd, and 3rd place before announcing. (${[winners.first && "1st", winners.second && "2nd", winners.third && "3rd"].filter(Boolean).join(", ") || "none"} selected)`}
                </p>
              </div>
            </div>
            {!showConfirmDialog ? (
              <Button
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
                disabled={!canAnnounce}
                onClick={() => setShowConfirmDialog(true)}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Announce Winners
              </Button>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">This will end the hackathon and make results public. Are you sure?</p>
                <Button
                  className="bg-red-600 hover:bg-red-500 text-white font-bold"
                  disabled={announcing}
                  onClick={handleAnnounceWinners}
                >
                  {announcing ? "Announcing..." : "Confirm"}
                </Button>
                <Button variant="outline" className="border-white/20 text-gray-300" onClick={() => setShowConfirmDialog(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin: Start New Hackathon — after winners announced */}
      {isAdmin && winnersAnnounced && (
        <div className="p-4 bg-violet-500/10 border border-violet-400/30 rounded-2xl">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-6 w-6 text-violet-400 shrink-0" />
              <div>
                <p className="text-white font-semibold">Hackathon Complete</p>
                <p className="text-sm text-gray-400">Winners have been announced. Ready to start a new hackathon?</p>
              </div>
            </div>
            {!showResetConfirm ? (
              <Button
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold"
                onClick={() => setShowResetConfirm(true)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Start New Hackathon
              </Button>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">This will delete ALL projects and reset everything. Are you sure?</p>
                <Button
                  className="bg-red-600 hover:bg-red-500 text-white font-bold"
                  disabled={resetting}
                  onClick={handleResetHackathon}
                >
                  {resetting ? "Resetting..." : "Yes, Reset"}
                </Button>
                <Button variant="outline" className="border-white/20 text-gray-300" onClick={() => setShowResetConfirm(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header message */}
      <div className="flex items-center gap-3 p-4 bg-[#2c244c] border border-violet-500/20 rounded-2xl">
        <Star className="h-6 w-6 text-violet-400 shrink-0" />
        <p className="text-gray-300">
          {winnersAnnounced
            ? "The hackathon has ended! Congratulations to all winners and participants."
            : "Admin view — review submissions and select winners."}
        </p>
      </div>

      {/* Search + Sort row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search by project name, team or keyword"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-500"
          />
          <Button className="bg-violet-600 hover:bg-violet-500 shrink-0">
            <Search className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Search</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-400">SORT</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-gray-200">
              <SelectValue placeholder="Select one" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="liked">Most Liked</SelectItem>
              <SelectItem value="viewed">Most Viewed</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-[#2c244c] border border-violet-500/20 rounded-2xl p-4 sticky top-24">
            <h3 className="font-semibold text-white mb-4">FILTER SUBMISSIONS</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">
                  Did you begin your project on or after December 9, 2025?
                </p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="startDate"
                      checked={filterStartDate === "yes"}
                      onChange={() => setFilterStartDate("yes")}
                      className="rounded-full"
                    />
                    <span className="text-sm text-gray-300">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="startDate"
                      checked={filterStartDate === "no"}
                      onChange={() => setFilterStartDate("no")}
                      className="rounded-full"
                    />
                    <span className="text-sm text-gray-300">No</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="startDate"
                      checked={filterStartDate === "all"}
                      onChange={() => setFilterStartDate("all")}
                      className="rounded-full"
                    />
                    <span className="text-sm text-gray-300">All</span>
                  </label>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Project type</p>
                <Select
                  value={filterProjectType}
                  onValueChange={(v) => setFilterProjectType(v as typeof filterProjectType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="solo">Solo</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterPitchFinalist}
                  onChange={(e) => setFilterPitchFinalist(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-300">Pitch Finalists</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Project grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              No projects match your filters. Try adjusting your search or filters.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSorted.map((submission) => {
                const ribbon = getLabelRibbon(submission);
                const imageUrl =
                  submission.screenshots?.[0] || "/AI_Innovation_Hub.png";

                return (
                  <Card key={submission.id} className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                    <Link href={`/hackathon/project/${submission.id}`}>
                      <div className="relative aspect-video bg-gray-100">
                        <Image
                          src={imageUrl}
                          alt={getProjectTitle(submission)}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        />
                        {ribbon && (
                          <div
                            className={`absolute top-2 left-2 px-2 py-0.5 text-xs font-bold rounded ${ribbon.className}`}
                          >
                            {ribbon.text}
                          </div>
                        )}
                      </div>
                    </Link>
                    <CardContent className="p-4 flex flex-col flex-1">
                      <Link href={`/hackathon/project/${submission.id}`}>
                        <h3 className="font-bold text-gray-900 line-clamp-1">
                          {getProjectTitle(submission)}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2 flex-1">
                          {getShortDescription(submission)}
                        </p>
                      </Link>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t">
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                            {(submission.fullName || "?")[0]}
                          </div>
                          <span className="text-xs text-gray-500 truncate max-w-[80px]">
                            {getTeamName(submission)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-500 text-sm">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {submission.views ?? 0}
                          </span>
                        </div>
                      </div>
                      {submission.builtWith && submission.builtWith.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {submission.builtWith.slice(0, 3).map((b) => (
                            <span
                              key={b}
                              className="text-xs px-1.5 py-0.5 bg-violet-600/20 text-violet-300 rounded"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Admin controls */}
                      {isAdmin && !winnersAnnounced && (
                        <div className="mt-3 pt-3 border-t flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={submission.place || "none"}
                            onValueChange={(v) => handlePlaceChange(submission.id!, v === "none" ? "" : v)}
                          >
                            <SelectTrigger className="flex-1 text-xs h-8">
                              <SelectValue placeholder="Select winner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Place</SelectItem>
                              <SelectItem value="first">1st Place</SelectItem>
                              <SelectItem value="second">2nd Place</SelectItem>
                              <SelectItem value="third">3rd Place</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                            disabled={deletingId === submission.id}
                            onClick={() => handleDeleteProject(submission.id!, getProjectTitle(submission))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {/* Prize disclaimer for winning team projects */}
                      {winnersAnnounced && submission.place && submission.projectType === "team" && (
                        <p className="mt-2 text-xs text-gray-400 italic">
                          Team prize — members decide how to share among themselves.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
