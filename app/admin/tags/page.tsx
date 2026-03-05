"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Plus, Edit2, Trash2, Tag, Shield, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TagCategory = "interests" | "expertise" | "techStack";

interface Tag {
  id: string;
  name: string;
  createdAt?: Date;
  usageCount?: number;
}

const categoryLabels: Record<TagCategory, string> = {
  interests: "Your Interests",
  expertise: "Your Expertise",
  techStack: "Technology Stack",
};

const categoryCollections: Record<TagCategory, string> = {
  interests: "Interests",
  expertise: "Expertise",
  techStack: "TechStack",
};

export default function AdminTagsPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<TagCategory>("interests");
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadTags();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeCategory]);

  const loadTags = async () => {
    setLoading(true);
    try {
      const collectionName = categoryCollections[activeCategory];
      const q = query(collection(db, collectionName), orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      const loadedTags = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name as string,
        createdAt: doc.data().createdAt?.toDate(),
        usageCount: doc.data().usageCount || 0,
      }));
      setTags(loadedTags);
    } catch (error) {
      console.error("Error loading tags:", error);
      toast({
        title: "Error",
        description: "Failed to load tags",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      toast({
        title: "Error",
        description: "Tag name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicates
    if (tags.some(t => t.name.toLowerCase() === newTagName.trim().toLowerCase())) {
      toast({
        title: "Error",
        description: "This tag already exists",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;
    setSaving(true);
    try {
      const collectionName = categoryCollections[activeCategory];
      const now = new Date();
      await addDoc(collection(db, collectionName), {
        name: newTagName.trim(),
        createdAt: now,
        usageCount: 0,
        createdBy: user.uid,
        updatedBy: user.uid,
        createdDate: now,
        updatedDate: now,
      });

      toast({
        title: "Success",
        description: "Tag added successfully",
      });

      setNewTagName("");
      setShowAddDialog(false);
      loadTags();
    } catch (error) {
      console.error("Error adding tag:", error);
      toast({
        title: "Error",
        description: "Failed to add tag",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditTag = async () => {
    if (!editingTag || !newTagName.trim()) {
      toast({
        title: "Error",
        description: "Tag name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicates (excluding current tag)
    if (tags.some(t => t.id !== editingTag.id && t.name.toLowerCase() === newTagName.trim().toLowerCase())) {
      toast({
        title: "Error",
        description: "This tag name already exists",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;
    setSaving(true);
    try {
      const collectionName = categoryCollections[activeCategory];
      const now = new Date();
      await updateDoc(doc(db, collectionName, editingTag.id), {
        name: newTagName.trim(),
        updatedBy: user.uid,
        updatedDate: now,
      });

      toast({
        title: "Success",
        description: "Tag updated successfully",
      });

      setEditingTag(null);
      setNewTagName("");
      setShowEditDialog(false);
      loadTags();
    } catch (error) {
      console.error("Error updating tag:", error);
      toast({
        title: "Error",
        description: "Failed to update tag",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    setSaving(true);
    try {
      const collectionName = categoryCollections[activeCategory];
      await deleteDoc(doc(db, collectionName, tagToDelete.id));

      toast({
        title: "Success",
        description: "Tag deleted successfully",
      });

      setTagToDelete(null);
      setShowDeleteDialog(false);
      loadTags();
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast({
        title: "Error",
        description: "Failed to delete tag",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (tag: Tag) => {
    setTagToDelete(tag);
    setShowDeleteDialog(true);
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
                Admin Panel - Tag Management
              </Badge>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-6 flex justify-between items-center">
            <Link href="/admin">
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Admin Panel
              </Button>
            </Link>
            <Link href="/admin/seed-tags">
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                Seed Default Tags
              </Button>
            </Link>
            <Button
              onClick={() => {
                setNewTagName("");
                setShowAddDialog(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Tag
            </Button>
          </div>

          <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
                <Tag className="w-6 h-6" />
                Manage Tags
              </CardTitle>
              <CardDescription>
                Create, edit, and delete tags for interests, expertise, and technology stack
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as TagCategory)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="interests">Your Interests</TabsTrigger>
                  <TabsTrigger value="expertise">Your Expertise</TabsTrigger>
                  <TabsTrigger value="techStack">Technology Stack</TabsTrigger>
                </TabsList>

                <TabsContent value={activeCategory} className="mt-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Loading tags...</span>
                    </div>
                  ) : tags.length === 0 ? (
                    <div className="text-center py-12">
                      <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No tags found. Add your first tag to get started.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tags.map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex-1">
                            <Badge variant="secondary" className="text-sm font-medium bg-blue-100 text-blue-700">
                              {tag.name}
                            </Badge>
                            {tag.usageCount !== undefined && tag.usageCount > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Used {tag.usageCount} time{tag.usageCount !== 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(tag)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(tag)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>

        {/* Add Tag Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New {categoryLabels[activeCategory]} Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tag Name
                </label>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g., Machine Learning"
                  onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTag} disabled={saving || !newTagName.trim()}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Tag"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Tag Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit {categoryLabels[activeCategory]} Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tag Name
                </label>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g., Machine Learning"
                  onKeyPress={(e) => e.key === "Enter" && handleEditTag()}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditTag} disabled={saving || !newTagName.trim()}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Tag"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the tag &quot;{tagToDelete?.name}&quot;. This action cannot be undone.
                {tagToDelete?.usageCount && tagToDelete.usageCount > 0 && (
                  <span className="block mt-2 text-amber-600">
                    Warning: This tag is currently used {tagToDelete.usageCount} time{tagToDelete.usageCount !== 1 ? "s" : ""}.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTag}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
}

