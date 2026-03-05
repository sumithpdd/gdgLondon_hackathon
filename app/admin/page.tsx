"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/AuthContext";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { PROJECTS_COLLECTION } from "@/lib/constants";
import { Submission } from "@/types/submission";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Trophy, Github, Linkedin, Twitter, Facebook, Instagram, Globe, Trash2, ChevronLeft, ChevronRight, Users, Shield, Tag } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
      const submissionRef = doc(db, PROJECTS_COLLECTION, submissionId);
      const newPlace = place === "none" ? null : (place as "first" | "second" | "third");
      const now = new Date();
      await updateDoc(submissionRef, {
        place: newPlace,
        updatedBy: user.uid,
        updatedDate: now,
        updatedAt: now,
      });
      
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
        description: "Failed to update winner place",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubmission = async () => {
    if (!submissionToDelete) return;
    
    setDeleting(true);
    try {
      const submission = submissions.find(s => s.id === submissionToDelete);
      
      // Delete screenshots from storage
      if (submission?.screenshots) {
        for (const screenshotUrl of submission.screenshots) {
          try {
            const storageRef = ref(storage, screenshotUrl);
            await deleteObject(storageRef);
          } catch (error) {
            console.error("Error deleting screenshot:", error);
          }
        }
      }
      
      // Delete submission document
      await deleteDoc(doc(db, PROJECTS_COLLECTION, submissionToDelete));
      
      setSubmissions(submissions.filter(s => s.id !== submissionToDelete));
      
      toast({
        title: "Success",
        description: "Submission deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting submission:", error);
      toast({
        title: "Error",
        description: "Failed to delete submission",
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const winners = {
    first: submissions.find(s => s.place === "first"),
    second: submissions.find(s => s.place === "second"),
    third: submissions.find(s => s.place === "third"),
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
                alt="GDG London" 
                width={180}
                height={60}
                className="h-12 w-auto"
              />
            </Link>
            <Badge variant="secondary" className="text-sm bg-red-100 text-red-700">
              <Shield className="w-3 h-3 mr-1" />
              Admin Panel
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <Link href="/">
            <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button 
              onClick={() => router.push('/admin/users')}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Users className="w-4 h-4 mr-2" />
              Manage User Roles
            </Button>
            <Button 
              onClick={() => router.push('/admin/tags')}
              variant="outline"
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              <Tag className="w-4 h-4 mr-2" />
              Manage Tags
            </Button>
          </div>
        </div>

        <div className="space-y-6">
            {/* Winners Section */}
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  <CardTitle className="text-gray-900">Competition Winners</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {['first', 'second', 'third'].map((place) => (
                    <div key={place} className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {place === 'first' && '🥇 First Place'}
                        {place === 'second' && '🥈 Second Place'}
                        {place === 'third' && '🥉 Third Place'}
                      </h4>
                      {winners[place as keyof typeof winners] ? (
                        <p className="text-sm text-gray-600">{winners[place as keyof typeof winners]?.fullName}</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Not selected yet</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{submissions.length}</p>
                    <p className="text-sm text-gray-600">Total Submissions</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {submissions.filter(s => s.status === "submitted").length}
                    </p>
                    <p className="text-sm text-gray-600">Submitted</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-600">
                      {submissions.filter(s => s.status === "draft").length}
                    </p>
                    <p className="text-sm text-gray-600">Drafts</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">
                      {submissions.filter(s => s.place).length}
                    </p>
                    <p className="text-sm text-gray-600">Winners Selected</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Submissions */}
            <div className="space-y-4">
              {submissions.map((submission) => (
                <Card key={submission.id} className="bg-white hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Screenshots */}
                      <div className="md:w-1/3">
                        {submission.screenshots && submission.screenshots.length > 0 && (
                          <div className="space-y-2">
                            <div 
                              className="relative h-48 rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition"
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
                                    className="relative h-16 rounded overflow-hidden cursor-pointer hover:opacity-75 transition bg-gray-100"
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
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{submission.fullName}</h3>
                            <p className="text-sm text-gray-500">
                              {submission.status === "submitted" ? "Submitted" : "Draft"} • 
                              {submission.createdAt?.toLocaleDateString()}
                            </p>
                          </div>
                          {submission.place && (
                            <Badge className={
                              submission.place === 'first' ? 'bg-yellow-500' :
                              submission.place === 'second' ? 'bg-gray-400' :
                              'bg-orange-600'
                            }>
                              {submission.place === 'first' && '🥇 Winner'}
                              {submission.place === 'second' && '🥈 2nd Place'}
                              {submission.place === 'third' && '🥉 3rd Place'}
                            </Badge>
                          )}
                        </div>

                        <p className="text-gray-700">{submission.appPurpose}</p>

                        {/* Interests */}
                        {submission.interests && submission.interests.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {submission.interests.map((interest, idx) => (
                              <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-700">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Social Links */}
                        <div className="flex gap-3 flex-wrap">
                          {submission.githubUrl && (
                            <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer"
                               className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600">
                              <Github className="w-4 h-4" />
                              GitHub
                            </a>
                          )}
                          {submission.linkedinUrl && (
                            <a href={submission.linkedinUrl} target="_blank" rel="noopener noreferrer"
                               className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600">
                              <Linkedin className="w-4 h-4" />
                              LinkedIn
                            </a>
                          )}
                          {submission.twitterUrl && (
                            <a href={submission.twitterUrl} target="_blank" rel="noopener noreferrer"
                               className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600">
                              <Twitter className="w-4 h-4" />
                              Twitter
                            </a>
                          )}
                        </div>

                        {/* Admin Actions */}
                        <div className="flex gap-4 pt-4 border-t border-gray-200">
                          <div className="flex-1">
                            <label className="text-sm text-gray-600 mb-1 block">Select Winner</label>
                            <Select
                              value={submission.place || "none"}
                              onValueChange={(value) => handlePlaceChange(submission.id!, value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Place</SelectItem>
                                <SelectItem value="first">🥇 First Place</SelectItem>
                                <SelectItem value="second">🥈 Second Place</SelectItem>
                                <SelectItem value="third">🥉 Third Place</SelectItem>
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
      </main>

      {/* Screenshot Dialog */}
      <Dialog open={showScreenshotDialog} onOpenChange={setShowScreenshotDialog}>
        <DialogContent className="max-w-4xl">
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
    </div>
    </ProtectedRoute>
  );
}
