"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/AuthContext";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  deleteProjectAsAdmin,
  setProjectWinnerPlace,
  callableErrorMessage,
} from "@/lib/admin-projects";
import { PROJECTS_COLLECTION } from "@/lib/constants";
import { Submission } from "@/types/submission";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Github, Linkedin, Twitter, Trash2, ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { HackathonResultsSummary } from "@/components/HackathonResultsSummary";
import { AdminShell } from "@/components/AdminShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const { user, userProfile } = useAuthContext();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScreenshots, setSelectedScreenshots] = useState<string[]>([]);
  const [showScreenshotDialog, setShowScreenshotDialog] = useState(false);
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user && userProfile) {
      fetchSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userProfile]);

  const fetchSubmissions = async () => {
    try {
      const q = query(collection(db, PROJECTS_COLLECTION), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Submission[];
      setSubmissions(data);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast({
        title: "Error",
        description: "Failed to load submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceChange = async (submissionId: string, place: string) => {
    if (!user) return;
    try {
      const newPlace = place === "none" ? null : (place as "first" | "second" | "third");
      await setProjectWinnerPlace(submissionId, newPlace);

      setSubmissions(submissions.map(sub =>
        sub.id === submissionId ? { ...sub, place: newPlace } : sub
      ));

      toast({
        title: "Success",
        description: `Winner place ${newPlace ? "updated" : "removed"} successfully`,
      });
    } catch (error) {
      console.error("Error updating place:", error);
      toast({
        title: "Error",
        description: callableErrorMessage(error) || "Failed to update winner place",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubmission = async () => {
    if (!submissionToDelete) return;

    setDeleting(true);
    try {
      await deleteProjectAsAdmin(submissionToDelete);

      setSubmissions(submissions.filter(s => s.id !== submissionToDelete));

      toast({
        title: "Success",
        description: "Submission deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting submission:", error);
      toast({
        title: "Error",
        description: callableErrorMessage(error) || "Failed to delete submission",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSubmissionToDelete(null);
    }
  };

  const openScreenshotDialog = (screenshots: string[], index: number = 0) => {
    setSelectedScreenshots(screenshots);
    setCurrentScreenshotIndex(index);
    setShowScreenshotDialog(true);
  };

  const nextScreenshot = () => {
    setCurrentScreenshotIndex((prev) => 
      prev < selectedScreenshots.length - 1 ? prev + 1 : 0
    );
  };

  const prevScreenshot = () => {
    setCurrentScreenshotIndex((prev) => 
      prev > 0 ? prev - 1 : selectedScreenshots.length - 1
    );
  };

  if (loading) {
    return (
        <AdminShell
          title="Admin dashboard"
          subtitle="Loading submissions…"
        >
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-500/30 border-t-emerald-400 mx-auto" />
              <p className="mt-4 text-gray-400">Loading…</p>
            </div>
          </div>
        </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Admin dashboard"
      subtitle="Review project submissions, assign winner places, and manage the competition."
    >
        <div className="space-y-8">
            <HackathonResultsSummary projects={submissions} />

            {/* Submissions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Tag className="h-5 w-5 text-violet-400" />
                  All submissions
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => router.push("/admin/tags")}
                >
                  Manage tags
                </Button>
              </div>
              {submissions.map((submission) => (
                <Card key={submission.id} className="border-white/10 bg-[#1a1528]/80 hover:border-violet-500/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Screenshots */}
                      <div className="md:w-1/3">
                        {submission.screenshots && submission.screenshots.length > 0 && (
                          <div className="space-y-2">
                            <div 
                              className="relative h-48 rounded-lg overflow-hidden bg-black/40 cursor-pointer hover:opacity-90 transition ring-1 ring-white/10"
                              onClick={() => openScreenshotDialog(submission.screenshots!, 0)}
                            >
                              <Image
                                src={submission.screenshots[0]}
                                alt="Main screenshot"
                                width={400}
                                height={300}
                                className="w-full h-full object-cover"
                              />
                              {submission.screenshots.length > 1 && (
                                <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                                  {submission.screenshots.length} photos
                                </Badge>
                              )}
                            </div>
                            
                            {/* Thumbnail grid */}
                            {submission.screenshots.length > 1 && (
                              <div className="grid grid-cols-4 gap-2">
                                {submission.screenshots.slice(0, 4).map((screenshot, idx) => (
                                  <div
                                    key={idx}
                                    className="relative h-16 rounded overflow-hidden cursor-pointer hover:opacity-75 transition bg-black/40 ring-1 ring-white/10"
                                    onClick={() => openScreenshotDialog(submission.screenshots!, idx)}
                                  >
                                    <Image
                                      src={screenshot}
                                      alt={`Thumbnail ${idx + 1}`}
                                      width={100}
                                      height={64}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="md:w-2/3 space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-white">{submission.fullName}</h3>
                            <p className="text-sm text-gray-400">
                              {submission.status === "submitted" ? "Submitted" : "Draft"} •{" "}
                              {submission.createdAt?.toLocaleDateString()}
                            </p>
                          </div>
                          {submission.place && (
                            <Badge className={
                              submission.place === 'first' ? 'bg-amber-500 text-black' :
                              submission.place === 'second' ? 'bg-slate-300 text-black' :
                              'bg-orange-600 text-white'
                            }>
                              {submission.place === 'first' && '🥇 Winner'}
                              {submission.place === 'second' && '🥈 2nd place'}
                              {submission.place === 'third' && '🥉 3rd place'}
                            </Badge>
                          )}
                        </div>

                        <p className="text-gray-300">{submission.appPurpose}</p>

                        {/* Interests */}
                        {submission.interests && submission.interests.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {submission.interests.map((interest, idx) => (
                              <Badge key={idx} variant="secondary" className="bg-violet-500/20 text-violet-200 border border-violet-500/30">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Social Links */}
                        <div className="flex gap-3 flex-wrap">
                          {submission.githubUrl && (
                            <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer"
                               className="flex items-center gap-1 text-sm text-gray-400 hover:text-emerald-400">
                              <Github className="w-4 h-4" />
                              GitHub
                            </a>
                          )}
                          {submission.linkedinUrl && (
                            <a href={submission.linkedinUrl} target="_blank" rel="noopener noreferrer"
                               className="flex items-center gap-1 text-sm text-gray-400 hover:text-emerald-400">
                              <Linkedin className="w-4 h-4" />
                              LinkedIn
                            </a>
                          )}
                          {submission.twitterUrl && (
                            <a href={submission.twitterUrl} target="_blank" rel="noopener noreferrer"
                               className="flex items-center gap-1 text-sm text-gray-400 hover:text-emerald-400">
                              <Twitter className="w-4 h-4" />
                              Twitter
                            </a>
                          )}
                        </div>

                        {/* Admin Actions */}
                        <div className="flex gap-4 pt-4 border-t border-white/10">
                          <div className="flex-1">
                            <label className="text-sm text-gray-400 mb-1 block">Select winner</label>
                            <Select
                              value={submission.place || "none"}
                              onValueChange={(value) => handlePlaceChange(submission.id!, value)}
                            >
                              <SelectTrigger className="w-full border-white/15 bg-black/20 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No place</SelectItem>
                                <SelectItem value="first">🥇 First place</SelectItem>
                                <SelectItem value="second">🥈 Second place</SelectItem>
                                <SelectItem value="third">🥉 Third place</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSubmissionToDelete(submission.id!);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
        </div>

      {/* Screenshot Dialog */}
      <Dialog open={showScreenshotDialog} onOpenChange={setShowScreenshotDialog}>
        <DialogContent className="max-w-4xl border-white/10 bg-[#13131c] text-white">
          <DialogHeader>
            <DialogTitle>
              Screenshot {currentScreenshotIndex + 1} of {selectedScreenshots.length}
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Image
              src={selectedScreenshots[currentScreenshotIndex]}
              alt={`Screenshot ${currentScreenshotIndex + 1}`}
              width={1200}
              height={800}
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
            />
            {selectedScreenshots.length > 1 && (
              <div className="flex justify-between mt-4">
                <Button onClick={prevScreenshot} variant="outline">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button onClick={nextScreenshot} variant="outline">
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this submission and all associated screenshots.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubmission}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
