"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PROJECTS_COLLECTION } from "@/lib/constants";
import { Submission } from "@/types/submission";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { getProjectTitle, getTeamName } from "@/lib/submission-utils";
import { Users, ExternalLink } from "lucide-react";

export default function ParticipantsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const q = query(
          collection(db, PROJECTS_COLLECTION),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.(),
          }))
          .filter((s) => (s as Submission).status === "submitted") as Submission[];
        setSubmissions(data);
      } catch (error) {
        console.error("Error fetching participants:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchParticipants();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
      </div>
    );
  }

  const participantCount = new Set(submissions.map((s) => s.userId)).size;
  const projectCount = submissions.length;

  return (
    <div className="space-y-8 max-w-4xl mx-auto text-center">
      <h1 className="text-3xl font-bold text-white">Participants</h1>

      <div className="grid sm:grid-cols-2 gap-4 text-left">
        <Card className="bg-[#2c244c] border-violet-500/20">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-violet-600/20">
                <Users className="h-8 w-8 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{participantCount}</p>
                <p className="text-sm text-gray-400">Unique participants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#2c244c] border-violet-500/20">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-violet-600/20">
                <ExternalLink className="h-8 w-8 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{projectCount}</p>
                <p className="text-sm text-gray-400">Projects submitted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#2c244c] border-violet-500/20 text-left">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white">Projects by participants</CardTitle>
          <CardDescription className="text-gray-400">
            Browse the Project Gallery to see all submissions and connect with teams.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-gray-500 py-8 text-center">
              No projects submitted yet. Check back after the hackathon begins.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {submissions.slice(0, 12).map((s) => (
                <Link
                  key={s.id}
                  href={`/hackathon/project/${s.id}`}
                  className="flex gap-3 p-3 rounded-xl border border-white/10 hover:border-violet-500/30 hover:bg-white/5 transition-colors"
                >
                  <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-white/5">
                    <Image
                      src={s.screenshots?.[0] || "/AI_Innovation_Hub.png"}
                      alt={getProjectTitle(s)}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate">
                      {getProjectTitle(s)}
                    </p>
                    <p className="text-sm text-gray-400 truncate">{getTeamName(s)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {submissions.length > 12 && (
            <div className="mt-4 text-center">
              <Link
                href="/hackathon/gallery"
                className="text-violet-400 hover:text-violet-300 font-medium"
              >
                View all {projectCount} projects in Gallery →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
