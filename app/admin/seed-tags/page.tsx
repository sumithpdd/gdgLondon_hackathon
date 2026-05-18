"use client";

import { useState } from "react";
import { useAuthContext } from "@/lib/AuthContext";
import { AdminShell } from "@/components/AdminShell";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";

const defaultTags = {
  Interests: [
    "Machine Learning",
    "Web Development",
    "Mobile Apps",
    "AI Ethics",
    "Data Science",
    "Cloud Computing",
    "IoT",
    "Blockchain",
  ],
  Expertise: [
    "Python",
    "JavaScript",
    "TensorFlow",
    "React",
    "Node.js",
    "Docker",
    "AWS",
    "Git",
  ],
  TechStack: [
    "React",
    "Next.js",
    "Python",
    "TensorFlow",
    "PyTorch",
    "Node.js",
    "MongoDB",
    "PostgreSQL",
    "Docker",
    "Kubernetes",
  ],
};

export default function SeedTagsPage() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [seeded, setSeeded] = useState({
    Interests: false,
    Expertise: false,
    TechStack: false,
  });

  const seedCollection = async (collectionName: string, tags: string[]) => {
    setLoading(true);
    try {
      const existingTags = await getDocs(collection(db, collectionName));
      const existingNames = existingTags.docs.map(doc => doc.data().name.toLowerCase());

      let added = 0;
      let skipped = 0;

      for (const tagName of tags) {
        // Check if tag already exists (case-insensitive)
        if (existingNames.includes(tagName.toLowerCase())) {
          skipped++;
          continue;
        }

        try {
          const now = new Date();
          await addDoc(collection(db, collectionName), {
            name: tagName,
            createdAt: now,
            usageCount: 0,
            createdBy: user?.uid || "system",
            updatedBy: user?.uid || "system",
            createdDate: now,
            updatedDate: now,
          });
          added++;
        } catch (error) {
          console.error(`Error adding tag ${tagName}:`, error);
        }
      }

      setSeeded(prev => ({ ...prev, [collectionName]: true }));

      toast({
        title: "Success",
        description: `${collectionName}: Added ${added} tags, skipped ${skipped} existing tags`,
      });
    } catch (error) {
      console.error(`Error seeding ${collectionName}:`, error);
      toast({
        title: "Error",
        description: `Failed to seed ${collectionName}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const seedAll = async () => {
    setLoading(true);
    try {
      for (const [collectionName, tags] of Object.entries(defaultTags)) {
        await seedCollection(collectionName, tags);
        // Small delay between collections
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      toast({
        title: "Complete",
        description: "All default tags have been seeded",
      });
    } catch (error) {
      console.error("Error seeding all tags:", error);
      toast({
        title: "Error",
        description: "Failed to seed some tags",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
      <AdminShell
        title="Seed default tags"
        subtitle="Add starter tags to each collection. Existing tag names are skipped."
      >
          <div className="mb-6">
            <Link href="/admin/tags">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Back to tag management
              </Button>
            </Link>
          </div>

          <Card className="border-white/10 bg-[#1a1528]/80">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Bulk seed</CardTitle>
              <p className="text-gray-400 mt-2 text-sm">
                Add default tags to the collections. Existing tags will be skipped (case-insensitive).
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {Object.entries(defaultTags).map(([collectionName, tags]) => (
                  <div key={collectionName} className="border border-white/10 rounded-xl p-4 bg-[#0f0a18]/60">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white">{collectionName}</h3>
                      {seeded[collectionName as keyof typeof seeded] && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-md text-sm bg-violet-500/15 text-violet-200 border border-violet-500/25"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Button
                      onClick={() => seedCollection(collectionName, tags)}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Seeding...
                        </>
                      ) : (
                        `Seed ${collectionName}`
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/10">
                <Button
                  onClick={seedAll}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Seeding all tags...
                    </>
                  ) : (
                    "Seed all collections"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
      </AdminShell>
  );
}

