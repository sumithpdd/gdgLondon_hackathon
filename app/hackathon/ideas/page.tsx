"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Submission } from "@/types/submission";
import { getProjectTitle } from "@/lib/submission-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Plus } from "lucide-react";
import { useAuthContext } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { createJoinRequest, getUserProject } from "@/lib/join-requests";
import { PROJECTS_COLLECTION, HACKATHON_DISPLAY_NAME } from "@/lib/constants";
import { useHackathonAuth } from "@/components/HackathonAuthShell";
import { isHackathonProfileComplete, JOIN_PROFILE_MIN_PERCENT } from "@/lib/profile-completion";
import { isCurrentIdeaGalleryProject } from "@/lib/hackathon-projects";
import { IdeaGalleryCard } from "@/components/IdeaGalleryCard";
import {
  IDEA_CATEGORY_FILTERS,
  RECRUITMENT_TAG_OPTIONS,
  filterIdeaGalleryProjects,
} from "@/lib/idea-gallery";
import { cn } from "@/lib/utils";

export default function IdeaGalleryPage() {
  const { user, isAuthenticated, userProfile } = useAuthContext();
  const { openSignIn } = useHackathonAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [recruitmentFilters, setRecruitmentFilters] = useState<string[]>([]);
  const [requestingIds, setRequestingIds] = useState<Set<string>>(new Set());
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [userHasProject, setUserHasProject] = useState(false);

  const profileComplete = isHackathonProfileComplete(userProfile);

  useEffect(() => {
    const checkUserProject = async () => {
      if (!user) {
        setUserHasProject(false);
        return;
      }
      const existing = await getUserProject(user.uid);
      setUserHasProject(existing !== null);
    };
    checkUserProject();
  }, [user]);

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const q = query(collection(db, PROJECTS_COLLECTION), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.(),
        })) as Submission[];
        setSubmissions(data.filter(isCurrentIdeaGalleryProject));
      } catch (error) {
        console.error("Error fetching ideas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchIdeas();
  }, []);

  const filtered = useMemo(
    () =>
      filterIdeaGalleryProjects(submissions, {
        categoryId,
        recruitmentTags: recruitmentFilters,
        searchQuery,
      }),
    [submissions, categoryId, recruitmentFilters, searchQuery]
  );

  const toggleRecruitment = (tag: string) => {
    setRecruitmentFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleRequestToJoin = async (submission: Submission) => {
    if (!user || !submission.id) return;

    if (!profileComplete) {
      toast({
        title: "Complete your hackathon profile",
        description: `Reach at least ${JOIN_PROFILE_MIN_PERCENT}% on your team join score (bio, LinkedIn, team preference) before requesting to join.`,
        variant: "destructive",
      });
      return;
    }

    setRequestingIds((prev) => new Set(prev).add(submission.id!));
    try {
      await createJoinRequest(
        submission.id,
        getProjectTitle(submission),
        user.uid,
        user.email || "",
        user.displayName || user.email || "Anonymous"
      );
      setRequestedIds((prev) => new Set(prev).add(submission.id!));
      toast({
        title: "Request sent!",
        description: `Your request to join "${getProjectTitle(submission)}" has been sent to the team owner.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      toast({
        title: "Could not send request",
        description: message,
        variant: "destructive",
      });
    } finally {
      setRequestingIds((prev) => {
        const next = new Set(prev);
        next.delete(submission.id!);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-1 pb-16">
      <header className="space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Real Projects.{" "}
            <span className="bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">
              Real Ambition.
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-gray-400">
            {HACKATHON_DISPLAY_NAME} — teams actively looking for collaborators, skills, and co-builders.
          </p>
          <p className="text-sm text-gray-500">
            Past hackathon ideas and winners on{" "}
            <Link href="/past-projects" className="text-pink-300 underline hover:text-white">
              Past projects
            </Link>
            .
          </p>
        </div>

        <Button
          asChild
          size="lg"
          className="bg-white text-black hover:bg-gray-100 font-semibold tracking-wide"
        >
          <Link href="/hackathon/my-projects?project=1">
            <Plus className="mr-2 h-4 w-4" />
            Submit project
          </Link>
        </Button>

        {isAuthenticated && userProfile && !profileComplete && (
          <div className="mx-auto max-w-xl rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <span className="font-medium">Profile incomplete — </span>
            reach {JOIN_PROFILE_MIN_PERCENT}% (bio, LinkedIn, team preference) before join requests.{" "}
            <Link href="/hackathon/profile" className="text-pink-300 underline hover:text-white">
              Edit profile
            </Link>
          </div>
        )}
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap justify-center gap-2">
          {IDEA_CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                categoryId === cat.id
                  ? "bg-pink-600 text-white shadow-md shadow-pink-500/25"
                  : "border border-white/15 bg-white/5 text-gray-300 hover:bg-white/10"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Looking for
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {RECRUITMENT_TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleRecruitment(tag)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  recruitmentFilters.includes(tag)
                    ? "border-pink-500/60 bg-pink-500/15 text-pink-200"
                    : "border-white/15 text-gray-400 hover:border-white/25 hover:text-gray-200"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mx-auto max-w-2xl">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search projects, teams, tech stack…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 rounded-full border-white/10 bg-white/5 pl-11 pr-28 text-white placeholder:text-gray-500"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 tabular-nums">
            {filtered.length} project{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-lg font-semibold text-white">Latest project drops</h2>

        {filtered.length === 0 ? (
          <Card className="border-white/10 bg-white/5">
            <CardContent className="py-16 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-gray-500" />
              <p className="text-gray-400">
                {submissions.length === 0
                  ? 'No projects are looking for team members yet. Create a project and toggle "Open to new team members" to appear here!'
                  : "No projects match your filters. Try clearing search or filters."}
              </p>
              {submissions.length === 0 && (
                <Button asChild className="mt-4 bg-pink-600 hover:bg-pink-500">
                  <Link href="/hackathon/my-projects?project=1">Submit your project</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((s) => (
              <IdeaGalleryCard
                key={s.id}
                submission={s}
                isOwner={user?.uid === s.userId}
                isAuthenticated={isAuthenticated}
                userHasProject={userHasProject}
                profileComplete={profileComplete}
                hasRequested={requestedIds.has(s.id!)}
                isRequesting={requestingIds.has(s.id!)}
                onRequestJoin={() => handleRequestToJoin(s)}
                onSignIn={() => openSignIn({ redirect: "/hackathon/ideas" })}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
