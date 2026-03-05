"use client";

import { useState } from "react";
import { useAuthContext } from "@/lib/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, Shield, CheckCircle2 } from "lucide-react";

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
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="inline-block">
                <Image 
                  src="/gdg-london-logo.png" 
                  alt="DevFest London 2025" 
                  width={180}
                  height={60}
                  className="h-12 w-auto"
                />
              </Link>
              <Badge variant="secondary" className="text-sm bg-red-100 text-red-700">
                <Shield className="w-3 h-3 mr-1" />
                Admin Panel - Seed Tags
              </Badge>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Link href="/admin/tags">
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tag Management
              </Button>
            </Link>
          </div>

          <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">Seed Default Tags</CardTitle>
              <p className="text-gray-600 mt-2">
                Add default tags to the collections. Existing tags will be skipped.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {Object.entries(defaultTags).map(([collectionName, tags]) => (
                  <div key={collectionName} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{collectionName}</h3>
                      {seeded[collectionName as keyof typeof seeded] && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
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

              <div className="pt-4 border-t border-gray-200">
                <Button
                  onClick={seedAll}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Seeding All Tags...
                    </>
                  ) : (
                    "Seed All Collections"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}

