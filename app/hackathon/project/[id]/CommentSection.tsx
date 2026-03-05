"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Trash2 } from "lucide-react";
import { useAuthContext } from "@/lib/AuthContext";
import { addComment, getComments, deleteComment } from "@/lib/comments";
import type { Comment } from "@/types/comment";
import { useToast } from "@/hooks/use-toast";

interface CommentSectionProps {
  projectId: string;
  onCountChange?: (count: number) => void;
}

export function CommentSection({ projectId, onCountChange }: CommentSectionProps) {
  const { user, userProfile } = useAuthContext();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getComments(projectId);
        setComments(data);
        onCountChange?.(data.length);
      } catch (err) {
        console.error("Error loading comments:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId, onCountChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addComment(
        projectId,
        text.trim(),
        user.uid,
        user.email || "",
        user.displayName || user.email?.split("@")[0] || "Anonymous"
      );
      const data = await getComments(projectId);
      setComments(data);
      setText("");
      onCountChange?.(data.length);
      toast({ title: "Comment added", description: "Thanks for your feedback!" });
    } catch (err) {
      console.error("Error adding comment:", err);
      toast({ title: "Error", description: "Could not add comment.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    const c = comments.find((x) => x.id === commentId);
    if (!c || !user) return;
    const isOwner = c.userId === user.uid;
    const isAdmin = userProfile?.role === "admin";
    if (!isOwner && !isAdmin) return;
    try {
      await deleteComment(projectId, commentId);
      const data = await getComments(projectId);
      setComments(data);
      onCountChange?.(data.length);
      toast({ title: "Comment removed" });
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast({ title: "Error", description: "Could not remove comment.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-4">
        <MessageCircle className="h-4 w-4 animate-pulse" />
        Loading comments…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-white flex items-center gap-2">
        <MessageCircle className="h-4 w-4" />
        Comments ({comments.length})
      </h3>

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="Add a comment…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="resize-none bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-500"
            maxLength={500}
          />
          <Button type="submit" size="sm" disabled={!text.trim() || submitting} className="bg-violet-600 hover:bg-violet-500">
            {submitting ? "Posting…" : "Post comment"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-gray-500">Sign in to leave a comment.</p>
      )}

      <ul className="space-y-3">
        {comments.map((c) => (
          <li
            key={c.id}
            className="flex items-start justify-between gap-2 p-3 bg-white/5 rounded-lg border border-white/10"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-200">{c.displayName}</p>
              <p className="text-sm text-gray-400 whitespace-pre-wrap break-words">{c.text}</p>
              <p className="text-xs text-gray-400 mt-1">
                {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
              </p>
            </div>
            {user && (c.userId === user.uid || userProfile?.role === "admin") && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 text-gray-400 hover:text-red-600"
                onClick={() => c.id && handleDelete(c.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </li>
        ))}
      </ul>
      {comments.length === 0 && (
        <p className="text-sm text-gray-500">No comments yet. Be the first to comment!</p>
      )}
    </div>
  );
}
