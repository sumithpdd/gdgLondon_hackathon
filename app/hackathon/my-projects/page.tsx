"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PROJECTS_COLLECTION } from "@/lib/constants";
import { Submission } from "@/types/submission";
import { useAuthContext } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { getProjectTitle, getTeamName } from "@/lib/submission-utils";
import { Plus, Pencil } from "lucide-react";

export default function MyProjectsPage() {
  const { user, isAuthenticated } = useAuthContext();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyProjects = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, PROJECTS_COLLECTION),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.(),
        })) as Submission[];
        setSubmissions(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyProjects();
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 mb-4">Sign in to view your projects.</p>
        <Link href="/submit">
          <Button className="bg-violet-600 hover:bg-violet-500">Submit a Project</Button>
        </Link>
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

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
        <h1 className="text-3xl font-bold text-white">My Projects</h1>
        <Link href="/submit">
          <Button className="bg-violet-600 hover:bg-violet-500">
            <Plus className="h-4 w-4 mr-2" />
            Submit Project
          </Button>
        </Link>
      </div>

      {submissions.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-16 text-center">
            <p className="text-gray-400 mb-4">You haven&apos;t submitted any projects yet.</p>
            <Link href="/submit">
              <Button className="bg-violet-600 hover:bg-violet-500">
                Submit Your First Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((s) => (
            <Card key={s.id} className="overflow-hidden bg-white/5 border-white/10">
              <div className="relative aspect-video bg-white/5">
                <Image
                  src={s.screenshots?.[0] || "/AI_Innovation_Hub.png"}
                  alt={getProjectTitle(s)}
                  fill
                  className="object-cover"
                />
                {s.status === "draft" && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded">
                    DRAFT
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-white">{getProjectTitle(s)}</h3>
                <p className="text-sm text-gray-400">{getTeamName(s)}</p>
                <div className="flex gap-2 mt-4">
                  <Link href={`/submit?edit=${s.id}`}>
                    <Button variant="outline" size="sm" className="border-white/30 text-gray-200 hover:bg-white/10">
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  {s.status === "submitted" && (
                    <Link href={`/hackathon/project/${s.id}`}>
                      <Button variant="outline" size="sm" className="border-white/30 text-gray-200 hover:bg-white/10">
                        View
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
