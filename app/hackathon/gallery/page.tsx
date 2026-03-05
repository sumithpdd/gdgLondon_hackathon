"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
import { Star, Search, Heart, MessageCircle, Eye } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { HACKATHON_START_DATE, PROJECTS_COLLECTION } from "@/lib/constants";

type SortOption = "recent" | "liked" | "viewed" | "trending";

export default function ProjectGalleryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filterStartDate, setFilterStartDate] = useState<"all" | "yes" | "no">("all");
  const [filterPitchFinalist, setFilterPitchFinalist] = useState(false);
  const [filterProjectType, setFilterProjectType] = useState<"all" | "solo" | "team">("all");

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const q = query(
          collection(db, PROJECTS_COLLECTION),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.(),
        })) as Submission[];
        const submittedOnly = data.filter((s) => s.status === "submitted");
        setSubmissions(submittedOnly);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let result = [...submissions];

    // Search
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

    // Filter: project start date
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

    // Filter: pitch finalists
    if (filterPitchFinalist) {
      result = result.filter((s) => s.pitchFinalist === true);
    }

    // Filter: solo/team
    if (filterProjectType !== "all") {
      result = result.filter((s) => s.projectType === filterProjectType);
    }

    // Sort
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

    return result;
  }, [
    submissions,
    searchQuery,
    sortBy,
    filterStartDate,
    filterPitchFinalist,
    filterProjectType,
  ]);

  const getLabelRibbon = (s: Submission) => {
    if (s.place === "first") return { text: "WINNER", className: "bg-amber-500 text-white" };
    if (s.place === "second" || s.place === "third")
      return { text: "WINNER", className: "bg-amber-500 text-white" };
    if (s.label === "winner") return { text: "WINNER", className: "bg-amber-500 text-white" };
    if (s.label === "finalist") return { text: "FINALIST", className: "bg-slate-600 text-white" };
    if (s.label === "featured") return { text: "FEATURED", className: "bg-violet-600 text-white" };
    return null;
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto">
      {/* Header message */}
      <div className="flex items-center gap-3 p-4 bg-[#2c244c] border border-violet-500/20 rounded-2xl">
        <Star className="h-6 w-6 text-violet-400 shrink-0" />
        <p className="text-gray-300">
          Connect with participants — support your favourite projects by liking, sharing, and commenting.
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
                  <Link key={submission.id} href={`/hackathon/project/${submission.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
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
                      <CardContent className="p-4 flex flex-col flex-1">
                        <h3 className="font-bold text-gray-900 line-clamp-1">
                          {getProjectTitle(submission)}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2 flex-1">
                          {getShortDescription(submission)}
                        </p>
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
                              <Heart className="h-4 w-4" />
                              {submission.likes ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              {submission.commentCount ?? 0}
                            </span>
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
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
