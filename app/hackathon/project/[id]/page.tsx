"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Submission } from "@/types/submission";
import { getProjectTitle, getTeamName } from "@/lib/submission-utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Github,
  Linkedin,
  Eye,
  Share2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { PROJECTS_COLLECTION } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

function getYouTubeEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    const v = u.searchParams.get("v") || u.pathname.split("/").pop();
    return v ? `https://www.youtube.com/embed/${v}` : url;
  } catch {
    return url;
  }
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

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

          // Increment view count
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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Project not found.</p>
        <Link href="/hackathon/gallery">
          <Button variant="outline" className="mt-4 border-white/30 text-gray-200 hover:bg-white/10">
            Back to Gallery
          </Button>
        </Link>
      </div>
    );
  }

  const imageUrl = submission.screenshots?.[0] || "/AI_Innovation_Hub.png";
  const isWinner =
    submission.place === "first" ||
    submission.place === "second" ||
    submission.place === "third" ||
    submission.label === "winner";
  const isFinalist = submission.label === "finalist";
  const isFeatured = submission.label === "featured";
  const getLabelRibbon = () => {
    if (isWinner) return { text: "WINNER", className: "bg-amber-500 text-white" };
    if (isFinalist) return { text: "FINALIST", className: "bg-slate-600 text-white" };
    if (isFeatured) return { text: "FEATURED", className: "bg-blue-600 text-white" };
    return null;
  };

  const handleShare = async () => {
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

  const labelRibbon = getLabelRibbon();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link
        href="/hackathon/gallery"
        className="inline-flex items-center text-sm text-gray-400 hover:text-white"
      >
        ← Back to Project Gallery
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative w-full md:w-80 aspect-video rounded-xl overflow-hidden bg-white/5 shrink-0">
          <Image
            src={imageUrl}
            alt={getProjectTitle(submission)}
            fill
            className="object-cover"
            priority
          />
          {labelRibbon && (
            <div className={`absolute top-2 left-2 px-3 py-1 text-sm font-bold rounded ${labelRibbon.className}`}>
              {labelRibbon.text}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">
            {getProjectTitle(submission)}
          </h1>
          <p className="text-lg text-gray-400 mt-1">{getTeamName(submission)}</p>
          <p className="text-sm text-gray-500 mt-1">
            {submission.projectType === "team" ? "Team project" : "Solo project"}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {submission.builtWith?.map((b) => (
              <Badge key={b} variant="secondary" className="bg-violet-600/20 text-violet-300 border-0">
                {b}
              </Badge>
            ))}
          </div>
          <div className="flex gap-4 mt-4 text-gray-400">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {submission.views ?? 0} views
            </span>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={handleShare} className="border-white/30 text-gray-200 hover:bg-white/10">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Description */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Description</CardTitle>
          <CardDescription className="text-gray-400">Problem → Solution → Impact</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 whitespace-pre-wrap">
            {submission.appPurpose || "No description provided."}
          </p>
        </CardContent>
      </Card>

      {/* Demo video */}
      {submission.demoVideoUrl && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Demo Video</CardTitle>
            <CardDescription className="text-gray-400">Max 3 minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video rounded-lg overflow-hidden bg-black/30">
              <iframe
                src={getYouTubeEmbedUrl(submission.demoVideoUrl)}
                title="Demo video"
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Code */}
      {submission.githubUrl && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Code Repository</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={submission.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-violet-400 hover:text-violet-300"
            >
              <Github className="h-5 w-5" />
              {submission.githubUrl}
              <ExternalLink className="h-4 w-4" />
            </a>
          </CardContent>
        </Card>
      )}

      {/* Team members */}
      {submission.teamMembers && submission.teamMembers.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {submission.teamMembers.map((m, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="font-medium text-gray-200">{m.name}</span>
                  {m.linkedinUrl && (
                    <a
                      href={m.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:text-violet-300"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Additional screenshots */}
      {submission.screenshots && submission.screenshots.length > 1 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Screenshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {submission.screenshots.slice(1).map((url, i) => (
                <div
                  key={i}
                  className="relative aspect-video rounded-lg overflow-hidden bg-white/5"
                >
                  <Image
                    src={url}
                    alt={`Screenshot ${i + 2}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
