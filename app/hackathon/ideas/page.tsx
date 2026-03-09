"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Submission } from "@/types/submission";
import { getProjectTitle, getTeamName, getShortDescription } from "@/lib/submission-utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, UserPlus, Loader2 } from "lucide-react";
import { useAuthContext } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createJoinRequest, getUserProject } from "@/lib/join-requests";
import { PROJECTS_COLLECTION } from "@/lib/constants";
import { AuthModal } from "@/components/AuthModal";

export default function IdeaGalleryPage() {
  const { user, isAuthenticated } = useAuthContext();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [requestingIds, setRequestingIds] = useState<Set<string>>(new Set());
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [showAuth, setShowAuth] = useState(false);
  const [userHasProject, setUserHasProject] = useState(false);

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
        const q = query(
          collection(db, PROJECTS_COLLECTION),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.(),
        })) as Submission[];
        const ideas = data.filter((s) => s.lookingForMembers === true);
        setSubmissions(ideas);
      } catch (error) {
        console.error("Error fetching ideas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchIdeas();
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return submissions;
    const q = searchQuery.toLowerCase();
    return submissions.filter(
      (s) =>
        getProjectTitle(s).toLowerCase().includes(q) ||
        getTeamName(s).toLowerCase().includes(q) ||
        (s.appPurpose || "").toLowerCase().includes(q)
    );
  }, [submissions, searchQuery]);

  const handleRequestToJoin = async (submission: Submission) => {
    if (!user || !submission.id) return;

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
    } catch (error: any) {
      toast({
        title: "Could not send request",
        description: error.message || "Something went wrong. Please try again.",
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">Idea Gallery</h1>
        <p className="text-gray-400">
          Browse project ideas looking for team members. Request to join and build together!
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by project name, team or keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-16 text-center">
            <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">
              {submissions.length === 0
                ? "No projects are looking for team members yet. Create a project and toggle \"Looking for members\" to appear here!"
                : "No projects match your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((s) => {
            const isOwner = user?.uid === s.userId;
            const isRequesting = requestingIds.has(s.id!);
            const hasRequested = requestedIds.has(s.id!);
            const memberCount = (s.teamMembers?.length || 0) + 1;

            return (
              <Card
                key={s.id}
                className="overflow-hidden bg-white/5 border-white/10 hover:border-violet-500/30 transition-colors"
              >
                <CardContent className="p-5 space-y-3">
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      {getProjectTitle(s)}
                    </h3>
                    <p className="text-sm text-violet-400">{getTeamName(s)}</p>
                  </div>

                  <p className="text-sm text-gray-400 line-clamp-3">
                    {getShortDescription(s)}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className="border-violet-500/30 text-violet-300 text-xs"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      {memberCount} member{memberCount !== 1 ? "s" : ""}
                    </Badge>
                    {s.projectType && (
                      <Badge
                        variant="outline"
                        className="border-white/20 text-gray-300 text-xs"
                      >
                        {s.projectType === "solo" ? "Solo (looking for team)" : "Team"}
                      </Badge>
                    )}
                    {s.builtWith?.slice(0, 3).map((tech) => (
                      <Badge
                        key={tech}
                        variant="outline"
                        className="border-white/20 text-gray-400 text-xs"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>

                  {isOwner ? (
                    <p className="text-xs text-gray-500 italic">This is your project</p>
                  ) : !isAuthenticated ? (
                    <Button
                      size="sm"
                      className="w-full bg-violet-600 hover:bg-violet-500"
                      onClick={() => setShowAuth(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Sign in to Request to Join
                    </Button>
                  ) : userHasProject ? (
                    <Button size="sm" className="w-full" disabled>
                      Already in a project
                    </Button>
                  ) : hasRequested ? (
                    <Button size="sm" className="w-full" disabled>
                      Request Sent
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full bg-violet-600 hover:bg-violet-500"
                      onClick={() => handleRequestToJoin(s)}
                      disabled={isRequesting}
                    >
                      {isRequesting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Request to Join
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
