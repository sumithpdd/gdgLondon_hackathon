"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Submission } from "@/types/submission";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PROJECTS_COLLECTION } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/lib/AuthContext";
import { useHackathonAuth } from "@/components/HackathonAuthShell";
import { createJoinRequest, getUserProject } from "@/lib/join-requests";
import { getProjectTitle } from "@/lib/submission-utils";
import { isHackathonProfileComplete, JOIN_PROFILE_MIN_PERCENT } from "@/lib/profile-completion";
import { isBookmarked, toggleBookmark } from "@/lib/bookmarks";
import { ProjectDetailView } from "@/components/project/ProjectDetailView";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const { user, isAuthenticated, userProfile } = useAuthContext();
  const { openSignIn } = useHackathonAuth();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [userHasProject, setUserHasProject] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const profileComplete = isHackathonProfileComplete(userProfile);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, PROJECTS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = {
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate?.(),
          } as Submission;
          setSubmission(data);
          await updateDoc(docRef, { views: increment(1) });
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  useEffect(() => {
    if (!user) {
      setUserHasProject(false);
      setBookmarked(false);
      return;
    }
    getUserProject(user.uid).then((p) => setUserHasProject(p !== null));
    if (id) {
      isBookmarked(user.uid, id).then(setBookmarked).catch(() => setBookmarked(false));
    }
  }, [user, id]);

  const handleShare = async () => {
    if (!submission) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({
          title: getProjectTitle(submission),
          text: `Check out ${getProjectTitle(submission)} on Build with AI Hackathon`,
          url,
        });
        toast({ title: "Shared!", description: "Thanks for sharing." });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied", description: "Project link copied to clipboard." });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied", description: "Project link copied to clipboard." });
      }
    }
  };

  const handleToggleBookmark = async () => {
    if (!user || !submission?.id) {
      openSignIn({ redirect: `/hackathon/project/${id}` });
      return;
    }
    setBookmarkLoading(true);
    try {
      const nowBookmarked = await toggleBookmark(user.uid, submission.id);
      setBookmarked(nowBookmarked);
      toast({
        title: nowBookmarked ? "Project saved" : "Removed from saved",
        description: nowBookmarked ? "Find it in your bookmarks." : undefined,
      });
    } catch {
      toast({ title: "Could not update bookmark", variant: "destructive" });
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleRequestJoin = async () => {
    if (!user || !submission?.id) return;
    if (!profileComplete) {
      toast({
        title: "Complete your hackathon profile",
        description: `Reach at least ${JOIN_PROFILE_MIN_PERCENT}% before requesting to join.`,
        variant: "destructive",
      });
      return;
    }
    setIsRequesting(true);
    try {
      await createJoinRequest(
        submission.id,
        getProjectTitle(submission),
        user.uid,
        user.email || "",
        user.displayName || user.email || "Anonymous"
      );
      setHasRequested(true);
      toast({
        title: "Request sent!",
        description: `Your request to join "${getProjectTitle(submission)}" was sent to the owner.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast({ title: "Could not send request", description: message, variant: "destructive" });
    } finally {
      setIsRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-pink-500" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Project not found.</p>
        <Link href="/hackathon/gallery">
          <Button variant="outline" className="mt-4 border-white/30 text-gray-200 hover:bg-white/10">
            Back to gallery
          </Button>
        </Link>
      </div>
    );
  }

  const recruiting = submission.lookingForMembers === true;
  const backHref = recruiting ? "/hackathon/ideas" : "/hackathon/gallery";
  const backLabel = recruiting ? "Back to idea gallery" : "Back to project gallery";

  return (
    <ProjectDetailView
      submission={submission}
      backHref={backHref}
      backLabel={backLabel}
      isOwner={user?.uid === submission.userId}
      isAuthenticated={isAuthenticated}
      userHasProject={userHasProject}
      profileComplete={profileComplete}
      hasRequested={hasRequested}
      isRequesting={isRequesting}
      isBookmarked={bookmarked}
      bookmarkLoading={bookmarkLoading}
      onShare={handleShare}
      onToggleBookmark={handleToggleBookmark}
      onRequestJoin={handleRequestJoin}
      onSignIn={() => openSignIn({ redirect: `/hackathon/project/${id}` })}
    />
  );
}
