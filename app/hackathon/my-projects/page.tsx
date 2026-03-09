"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PROJECTS_COLLECTION } from "@/lib/constants";
import { Submission } from "@/types/submission";
import { useAuthContext } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { getProjectTitle, getTeamName } from "@/lib/submission-utils";
import {
  Plus,
  Pencil,
  Users,
  CheckCircle2,
  FileText,
  Github,
  Video,
  Trophy,
} from "lucide-react";
import { JoinRequestsReceived } from "@/components/JoinRequestsReceived";
import { JoinRequestsSent } from "@/components/JoinRequestsSent";
import { getUserProject } from "@/lib/join-requests";
import { getHackathonConfig } from "@/lib/hackathon-config";

export default function MyProjectPage() {
  const { user, isAuthenticated } = useAuthContext();
  const [project, setProject] = useState<Submission | null>(null);
  const [memberProject, setMemberProject] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"owner" | "member" | null>(null);
  const [winnersAnnounced, setWinnersAnnounced] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const [config, userProjectInfo] = await Promise.all([
          getHackathonConfig(),
          getUserProject(user.uid),
        ]);
        setWinnersAnnounced(config.winnersAnnounced);

        if (!userProjectInfo) {
          setLoading(false);
          return;
        }

        setUserRole(userProjectInfo.role);

        if (userProjectInfo.role === "owner") {
          const q = query(
            collection(db, PROJECTS_COLLECTION),
            where("userId", "==", user.uid)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            setProject({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate?.(),
            } as Submission);
          }
        } else {
          // Member — fetch the project they belong to
          const { doc: getDocById, getDoc } = await import("firebase/firestore");
          const projSnap = await getDoc(getDocById(db, PROJECTS_COLLECTION, userProjectInfo.projectId));
          if (projSnap.exists()) {
            setMemberProject({
              id: projSnap.id,
              ...projSnap.data(),
              createdAt: projSnap.data().createdAt?.toDate?.(),
            } as Submission);
          }
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 mb-4">Sign in to view your project.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
      </div>
    );
  }

  const displayProject = project || memberProject;

  // No project yet
  if (!displayProject) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white">My Project</h1>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-16 text-center">
            <p className="text-gray-400 mb-4">You haven&apos;t joined or created a project yet.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/submit">
                <Button className="bg-violet-600 hover:bg-violet-500">
                  <Plus className="h-4 w-4 mr-2" />
                  Create a Project
                </Button>
              </Link>
              <Link href="/hackathon/ideas">
                <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">
                  Browse Ideas
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        {user && <JoinRequestsSent userId={user.uid} />}
      </div>
    );
  }

  const isSubmitted = displayProject.status === "submitted";
  const isDraft = displayProject.status === "draft";
  const isOwner = userRole === "owner";
  const hasPlace = displayProject.place && winnersAnnounced;

  const placeLabels: Record<string, { text: string; color: string }> = {
    first: { text: "1st Place Winner", color: "bg-amber-500" },
    second: { text: "2nd Place Winner", color: "bg-gray-400" },
    third: { text: "3rd Place Winner", color: "bg-amber-700" },
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">My Project</h1>
        {isOwner && isDraft && (
          <Link href={`/submit?edit=${displayProject.id}`}>
            <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">
              <Pencil className="h-4 w-4 mr-2" />
              Edit Draft
            </Button>
          </Link>
        )}
      </div>

      {/* Winner banner */}
      {hasPlace && displayProject.place && placeLabels[displayProject.place] && (
        <div className={`p-4 rounded-2xl ${placeLabels[displayProject.place].color} text-white flex items-center gap-3`}>
          <Trophy className="h-6 w-6 shrink-0" />
          <div>
            <p className="font-bold text-lg">{placeLabels[displayProject.place].text}</p>
            <p className="text-sm opacity-90">Congratulations! Your project has been recognized.</p>
            {displayProject.projectType === "team" && (
              <p className="text-xs opacity-75 mt-1">
                Team prize — members decide how to share among themselves.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Status badge */}
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        {/* Project image */}
        {displayProject.screenshots && displayProject.screenshots.length > 0 && (
          <div className="relative aspect-video bg-white/5">
            <Image
              src={displayProject.screenshots[0]}
              alt={getProjectTitle(displayProject)}
              fill
              className="object-cover"
            />
          </div>
        )}

        <CardContent className="p-6 space-y-5">
          {/* Title + status */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-white">{getProjectTitle(displayProject)}</h2>
              <p className="text-gray-400 mt-1">{getTeamName(displayProject)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isSubmitted && (
                <Badge className="bg-green-600 text-white gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Submitted
                </Badge>
              )}
              {isDraft && (
                <Badge className="bg-amber-500 text-white">Draft</Badge>
              )}
              {userRole === "member" && (
                <Badge variant="outline" className="border-violet-400 text-violet-300">
                  <Users className="h-3 w-3 mr-1" />
                  Team Member
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          {displayProject.appPurpose && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">About</h3>
              <p className="text-gray-300 whitespace-pre-wrap">{displayProject.appPurpose}</p>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-3">
            {displayProject.githubUrl && (
              <a href={displayProject.githubUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="border-white/20 text-gray-300 hover:bg-white/10">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub Repo
                </Button>
              </a>
            )}
            {displayProject.demoVideoUrl && (
              <a href={displayProject.demoVideoUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="border-white/20 text-gray-300 hover:bg-white/10">
                  <Video className="h-4 w-4 mr-2" />
                  Demo Video
                </Button>
              </a>
            )}
            {isSubmitted && displayProject.id && (
              <Link href={`/hackathon/project/${displayProject.id}`}>
                <Button variant="outline" size="sm" className="border-white/20 text-gray-300 hover:bg-white/10">
                  <FileText className="h-4 w-4 mr-2" />
                  View Full Page
                </Button>
              </Link>
            )}
          </div>

          {/* Built with */}
          {displayProject.builtWith && displayProject.builtWith.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Built with</h3>
              <div className="flex flex-wrap gap-2">
                {displayProject.builtWith.map((b) => (
                  <Badge key={b} variant="outline" className="border-violet-400/30 text-violet-300">
                    {b}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Team members */}
          {displayProject.teamMembers && displayProject.teamMembers.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Team Members</h3>
              <div className="flex flex-wrap gap-2">
                {displayProject.teamMembers.map((m, i) => (
                  <Badge key={i} variant="outline" className="border-white/20 text-gray-300">
                    <Users className="h-3 w-3 mr-1" />
                    {m.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Screenshots gallery */}
          {displayProject.screenshots && displayProject.screenshots.length > 1 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Screenshots</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {displayProject.screenshots.slice(1).map((url, i) => (
                  <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-white/5">
                    <Image src={url} alt={`Screenshot ${i + 2}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Join requests for project owners */}
      {isOwner && displayProject.lookingForMembers && displayProject.id && (
        <JoinRequestsReceived projectId={displayProject.id} />
      )}

      {/* Outgoing join requests */}
      {user && <JoinRequestsSent userId={user.uid} />}
    </div>
  );
}
